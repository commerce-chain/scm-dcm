// Copyright (c) Better Data, Inc.
// SPDX-License-Identifier: Apache-2.0

import type { TrustScoringAdapter } from "../adapters/trust-scoring.adapter";

export type FederationMerchantTier = "VERIFIED" | "REGISTERED" | "DISCOVERED";

export interface NormalizedOffer {
  id: string;
  source: "centralized" | "federated";
  productMasterId?: string;
  name: string;
  brand?: string;
  description?: string;
  gtin?: string;
  category?: string;
  images?: string[];
  price: {
    amount: number;
    currency: string;
  };
  compareAtPrice?: {
    amount: number;
    currency: string;
  };
  inStock: boolean;
  availableQuantity?: number;
  vendor: {
    id: string;
    name: string;
    domain?: string;
    rating?: number;
    tier?: FederationMerchantTier;
  };
  platform?: string;
  platformProductId?: string;
  platformVariantId?: string;
  location?: {
    lat: number;
    lng: number;
    city?: string;
    state?: string;
    country?: string;
  };
  authenticated: boolean;
  trustScore?: number;
  freshness: "real-time" | "snapshot" | "stale";
  metadata?: Record<string, unknown>;
}

export interface FederationProduct {
  id: string;
  name: string;
  description?: string;
  price: {
    amount: number;
    currency: string;
  };
  compareAtPrice?: {
    amount: number;
    currency: string;
  };
  inStock: boolean;
  availableQuantity?: number;
  images?: string[];
  gtin?: string;
  brand?: string;
  category?: string;
  metadata?: Record<string, unknown>;
}

export interface FederationAttribution {
  merchant: {
    domain: string;
    name: string;
    tier?: FederationMerchantTier;
    logoUrl?: string;
  };
}

export interface FederatedResult<T> {
  status: "ok" | "merchant_not_connected" | "capability_not_supported" | "timeout" | "error";
  data?: T;
  message?: string;
  alternatives?: Array<{ domain: string; name: string }>;
  attribution?: FederationAttribution;
}

export interface FederationSearchResult {
  products: Array<{
    id: string;
    name: string;
    description?: string;
    price: { amount: number; currency: string };
    compareAtPrice?: { amount: number; currency: string };
    images?: Array<{ url: string; alt?: string }>;
    availability?: { inStock: boolean; quantity?: number };
    gtin?: string;
    brand?: string;
    category?: string;
    [key: string]: unknown;
  }>;
  total: number;
  hasMore: boolean;
}

export interface CentralizedListing {
  listingId: string;
  productMasterId?: string;
  productName: string;
  brand?: string;
  description?: string;
  gtin?: string;
  category?: string;
  vendorOrgId: string;
  vendorName: string;
  vendorRating?: number;
  price: number;
  currency: string;
  inStock: boolean;
  authenticated: boolean;
  platform?: string;
  platformProductId?: string;
  locationLat?: number;
  locationLng?: number;
  city?: string;
  state?: string;
  country?: string;
}

const defaultTrustScoringAdapter: TrustScoringAdapter = {
  centralizedTrustScore: (listing) => {
    let score = 0.5;
    if (listing.authenticated) score += 0.3;
    if (listing.vendorRating) score += Math.min(Number(listing.vendorRating) / 10, 0.2);
    return Math.min(score, 1.0);
  },
  federationTrustScore: (tier) => {
    if (tier === "VERIFIED") return 0.9;
    if (tier === "REGISTERED") return 0.7;
    return 0.5;
  }
};

export interface OfferNormalizerConfig {
  trustScoring?: TrustScoringAdapter;
}

export class OfferNormalizerService {
  private readonly trustScoring: TrustScoringAdapter;

  constructor(config?: OfferNormalizerConfig) {
    this.trustScoring = config?.trustScoring ?? defaultTrustScoringAdapter;
  }

  normalizeFederationOffer(
    product: FederationProduct,
    attribution: FederationAttribution,
    options?: {
      productMasterId?: string;
      location?: { lat: number; lng: number; city?: string; state?: string; country?: string };
    }
  ): NormalizedOffer {
    return {
      id: product.id,
      source: "federated",
      productMasterId: options?.productMasterId,
      name: product.name,
      brand: product.brand,
      description: product.description,
      gtin: product.gtin,
      category: product.category,
      images: product.images || [],
      price: { amount: product.price.amount, currency: product.price.currency },
      compareAtPrice: product.compareAtPrice
        ? { amount: product.compareAtPrice.amount, currency: product.compareAtPrice.currency }
        : undefined,
      inStock: product.inStock,
      availableQuantity: product.availableQuantity,
      vendor: {
        id: attribution.merchant.domain,
        name: attribution.merchant.name,
        domain: attribution.merchant.domain,
        tier: attribution.merchant.tier || "DISCOVERED"
      },
      platform: undefined,
      platformProductId: undefined,
      platformVariantId: undefined,
      location: options?.location,
      authenticated: false,
      trustScore: this.trustScoring.federationTrustScore(attribution.merchant.tier),
      freshness: "real-time",
      metadata: {
        ...product.metadata,
        federation: {
          domain: attribution.merchant.domain,
          tier: attribution.merchant.tier || "DISCOVERED"
        }
      }
    };
  }

  normalizeCentralizedListing(
    listing: CentralizedListing,
    options?: {
      images?: string[];
      platformVariantId?: string;
    }
  ): NormalizedOffer {
    return {
      id: listing.listingId,
      source: "centralized",
      productMasterId: listing.productMasterId || undefined,
      name: listing.productName,
      brand: listing.brand || undefined,
      description: listing.description || undefined,
      gtin: listing.gtin || undefined,
      category: listing.category || undefined,
      images: options?.images || [],
      price: { amount: Number(listing.price), currency: listing.currency },
      inStock: listing.inStock,
      availableQuantity: undefined,
      vendor: {
        id: listing.vendorOrgId,
        name: listing.vendorName,
        rating: listing.vendorRating ? Number(listing.vendorRating) : undefined
      },
      platform: listing.platform || undefined,
      platformProductId: listing.platformProductId || undefined,
      platformVariantId: options?.platformVariantId || undefined,
      location:
        listing.locationLat && listing.locationLng
          ? {
              lat: Number(listing.locationLat),
              lng: Number(listing.locationLng),
              city: listing.city || undefined,
              state: listing.state || undefined,
              country: listing.country || "US"
            }
          : undefined,
      authenticated: listing.authenticated,
      trustScore: this.trustScoring.centralizedTrustScore(listing),
      freshness: "snapshot",
      metadata: {
        centralized: {
          vendorOrgId: listing.vendorOrgId,
          platform: listing.platform
        }
      }
    };
  }

  normalizeFederationResults(
    results: Array<FederatedResult<FederationSearchResult>>,
    productMasterMap?: Map<string, string>
  ): NormalizedOffer[] {
    const offers: NormalizedOffer[] = [];
    for (const result of results) {
      if (result.status !== "ok" || !result.data || !result.attribution) continue;
      for (const product of result.data.products || []) {
        const federationProduct: FederationProduct = {
          id: product.id,
          name: product.name,
          description: product.description,
          price: product.price,
          compareAtPrice: product.compareAtPrice,
          inStock: product.availability?.inStock ?? true,
          availableQuantity: product.availability?.quantity,
          images: product.images?.map((img) => (typeof img === "string" ? img : img.url)),
          gtin: product.gtin as string | undefined,
          brand: product.brand as string | undefined,
          category: product.category as string | undefined,
          metadata: product as Record<string, unknown>
        };
        const productMasterId = product.gtin && productMasterMap?.get(product.gtin as string);
        offers.push(this.normalizeFederationOffer(federationProduct, result.attribution, { productMasterId }));
      }
    }
    return offers;
  }
}

export function createOfferNormalizerService(config?: OfferNormalizerConfig): OfferNormalizerService {
  return new OfferNormalizerService(config);
}
