// Copyright (c) Better Data, Inc.
// SPDX-License-Identifier: Apache-2.0

import type { Product, SearchQuery, SearchResult, SearchService as ISearchService } from "@betterdata/commerce-gateway";
import type {
  RankedListing,
  RankingAdapter,
  RankingSearchResultRow,
  RankingUserLocation
} from "../adapters/ranking.adapter";

export interface SearchScope {
  type: "global" | "shopify_store" | "square_merchant" | "vendor" | "platform";
  domain?: string;
  merchantId?: string;
  vendorId?: string;
  platform?: string;
  locationId?: string;
}

export interface MarketplaceSearchFilters {
  brand?: string;
  category?: string;
  size?: string;
  color?: string;
  gender?: string;
  priceMin?: number;
  priceMax?: number;
  authenticatedOnly?: boolean;
  inStockOnly?: boolean;
  vendorOrgId?: string;
}

export interface MarketplaceSearchQuery extends Omit<SearchQuery, "sortBy"> {
  scope?: SearchScope;
  userLocation?: RankingUserLocation;
  filters?: MarketplaceSearchFilters;
  sortBy?: "relevance" | "price_low" | "price_high" | "newest" | "distance";
}

export interface MarketplaceProductResult {
  product: {
    id: string;
    brand: string;
    name: string;
    description: string;
    gtin?: string;
    images?: string[];
  };
  listings: RankedListing[];
  totalVendors: number;
  relevanceScore: number;
}

export interface MarketplaceSearchResponse {
  results: MarketplaceProductResult[];
  total: number;
  query: string;
  filters: MarketplaceSearchFilters;
  timing: {
    searchMs: number;
    rankingMs: number;
    totalMs: number;
  };
}

export interface MarketplaceSearchDataAdapter {
  searchIndexFindMany: (params: {
    where: Record<string, unknown>;
    take: number;
    orderBy: Array<Record<string, "asc" | "desc">>;
  }) => Promise<RankingSearchResultRow[]>;
  searchSuggest: (params: {
    prefix: string;
    take: number;
  }) => Promise<Array<{ productName: string; brand: string }>>;
  findProductMasterById: (id: string) => Promise<{
    id: string;
    brandName: string | null;
    productName: string;
    description: string | null;
    gtin: string | null;
  } | null>;
}

export interface MarketplaceSearchServiceConfig {
  data: MarketplaceSearchDataAdapter;
  ranking: RankingAdapter;
  defaultLimit?: number;
  maxListingsPerProduct?: number;
}

function calculateDistance(point1: RankingUserLocation, point2: RankingUserLocation): number {
  const r = 3959;
  const dLat = ((point2.lat - point1.lat) * Math.PI) / 180;
  const dLng = ((point2.lng - point1.lng) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((point1.lat * Math.PI) / 180) *
      Math.cos((point2.lat * Math.PI) / 180) *
      Math.sin(dLng / 2) *
      Math.sin(dLng / 2);
  return r * (2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a)));
}

function buildScopeWhereClause(scope?: SearchScope): Record<string, unknown> {
  if (!scope || scope.type === "global") {
    return {};
  }
  const where: Record<string, unknown> = {};
  if (scope.type === "shopify_store") {
    where.platform = "shopify";
    if (scope.domain) where.shopifyDomain = scope.domain;
  } else if (scope.type === "square_merchant") {
    where.platform = "square";
    if (scope.merchantId) where.merchantId = scope.merchantId;
  } else if (scope.type === "vendor") {
    if (scope.vendorId) where.vendorOrgId = scope.vendorId;
  } else if (scope.type === "platform") {
    if (scope.platform) where.platform = scope.platform;
  }
  if (scope.locationId) where.squareLocationId = scope.locationId;
  return where;
}

export class MarketplaceSearchService implements ISearchService {
  private readonly data: MarketplaceSearchDataAdapter;
  private readonly ranking: RankingAdapter;
  private readonly defaultLimit: number;
  private readonly maxListingsPerProduct: number;

  constructor(config: MarketplaceSearchServiceConfig) {
    this.data = config.data;
    this.ranking = config.ranking;
    this.defaultLimit = config.defaultLimit ?? 20;
    this.maxListingsPerProduct = config.maxListingsPerProduct ?? 3;
  }

  async search(query: SearchQuery): Promise<SearchResult> {
    const startTime = Date.now();
    const response = await this.searchMarketplace(query as MarketplaceSearchQuery);
    const products = response.results.flatMap((result) =>
      result.listings.slice(0, 1).map((listing) => ({
        id: listing.id,
        externalId: listing.platformProductId,
        name: result.product.name,
        description: result.product.description,
        brand: result.product.brand,
        price: listing.price,
        currency: listing.currency,
        images: result.product.images,
        inStock: listing.inStock,
        quantity: listing.availableQuantity,
        gtin: result.product.gtin,
        metadata: {
          vendorName: listing.vendorName,
          vendorRating: listing.vendorRating,
          authenticated: listing.authenticated,
          platform: listing.platform
        }
      }))
    ) as unknown as Product[];

    return {
      products,
      total: response.total,
      query,
      timing: { searchMs: Date.now() - startTime }
    } as unknown as SearchResult;
  }

  async suggest(prefix: string, limit = 10): Promise<string[]> {
    if (!prefix || prefix.length < 2) return [];
    const rows = await this.data.searchSuggest({ prefix, take: limit * 2 });
    const suggestions = new Set<string>();
    for (const row of rows) {
      if (row.productName.toLowerCase().startsWith(prefix.toLowerCase())) suggestions.add(row.productName);
      if (row.brand.toLowerCase().startsWith(prefix.toLowerCase())) suggestions.add(row.brand);
    }
    return Array.from(suggestions).slice(0, limit);
  }

  async searchMarketplace(query: MarketplaceSearchQuery): Promise<MarketplaceSearchResponse> {
    const startTime = Date.now();
    const limit = query.limit ?? this.defaultLimit;
    const filters = query.filters ?? {};
    const searchStart = Date.now();
    const rows = await this.executeSearch(query);
    const searchMs = Date.now() - searchStart;
    const rankStart = Date.now();
    const results = await this.processResults(rows, query, limit);
    const rankingMs = Date.now() - rankStart;
    return {
      results,
      total: results.length,
      query: query.text,
      filters,
      timing: { searchMs, rankingMs, totalMs: Date.now() - startTime }
    };
  }

  private async executeSearch(query: MarketplaceSearchQuery): Promise<RankingSearchResultRow[]> {
    const take = (query.limit ?? this.defaultLimit) * 5;
    const where = this.buildWhereClause(query);
    const rows = await this.data.searchIndexFindMany({
      where,
      take,
      orderBy: [{ totalSales: "desc" }, { viewCount: "desc" }]
    });
    return rows.map((row) => {
      let distance: number | null = null;
      if (query.userLocation && row.locationLat && row.locationLng) {
        distance = calculateDistance(query.userLocation, {
          lat: Number(row.locationLat),
          lng: Number(row.locationLng)
        });
      }
      return {
        ...row,
        distance,
        relevance: row.relevance ?? 1
      };
    });
  }

  private buildWhereClause(query: MarketplaceSearchQuery): Record<string, unknown> {
    const where: Record<string, unknown> = { active: true };
    Object.assign(where, buildScopeWhereClause(query.scope));
    if (query.text?.trim()) where.searchText = { contains: query.text };
    if (query.filters?.brand) where.brand = query.filters.brand;
    if (query.filters?.category) where.category = query.filters.category;
    if (query.filters?.priceMin !== undefined || query.filters?.priceMax !== undefined) {
      where.price = {};
      if (query.filters.priceMin !== undefined) (where.price as Record<string, number>).gte = query.filters.priceMin;
      if (query.filters.priceMax !== undefined) (where.price as Record<string, number>).lte = query.filters.priceMax;
    }
    if (query.filters?.authenticatedOnly) where.authenticated = true;
    if (query.filters?.inStockOnly !== false) where.inStock = true;
    if (query.filters?.vendorOrgId) where.vendorOrgId = query.filters.vendorOrgId;
    return where;
  }

  private async processResults(
    rows: RankingSearchResultRow[],
    query: MarketplaceSearchQuery,
    limit: number
  ): Promise<MarketplaceProductResult[]> {
    const grouped = new Map<string, RankingSearchResultRow[]>();
    for (const row of rows) {
      const key = row.productMasterId;
      const existing = grouped.get(key) ?? [];
      existing.push(row);
      grouped.set(key, existing);
    }
    const isScoped = query.scope && query.scope.type !== "global";
    const results: MarketplaceProductResult[] = [];
    for (const [productMasterId, listings] of grouped) {
      const productMaster = await this.data.findProductMasterById(productMasterId);
      if (!productMaster) continue;
      const rankedListings = this.ranking.rankListings(listings, {
        userLocation: query.userLocation,
        sortBy: query.sortBy as "relevance" | "price_low" | "price_high" | "distance"
      });
      const maxListings = isScoped ? 999 : this.maxListingsPerProduct;
      const topListings = rankedListings.slice(0, maxListings);
      results.push({
        product: {
          id: productMaster.id,
          brand: productMaster.brandName ?? "",
          name: productMaster.productName,
          description: productMaster.description ?? "",
          gtin: productMaster.gtin ?? undefined,
          images: []
        },
        listings: topListings,
        totalVendors: listings.length,
        relevanceScore: topListings[0]?.relevanceScore ?? 0
      });
    }
    results.sort((a, b) => b.relevanceScore - a.relevanceScore);
    return results.slice(0, limit);
  }
}

export function createMarketplaceSearchService(config: MarketplaceSearchServiceConfig): MarketplaceSearchService {
  return new MarketplaceSearchService(config);
}
