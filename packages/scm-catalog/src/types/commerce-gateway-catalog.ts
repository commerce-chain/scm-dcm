// Copyright (c) Better Data, Inc.
// SPDX-License-Identifier: Apache-2.0
//
// Structural copies of @betterdata/commerce-gateway catalog/search interfaces so
// scm-catalog stays publishable without a workspace dependency on commerce-gateway.
// Keep aligned with packages/commerce-gateway/src/catalog/interfaces.ts.

export interface Product {
  id: string;
  externalId?: string;
  name: string;
  description?: string;
  brand?: string;
  category?: string;
  price: number;
  compareAtPrice?: number;
  currency: string;
  images?: string[];
  inStock: boolean;
  quantity?: number;
  variants?: ProductVariant[];
  sku?: string;
  gtin?: string;
  metadata?: Record<string, unknown>;
}

export interface ProductVariant {
  id: string;
  externalId?: string;
  name: string;
  sku?: string;
  price: number;
  compareAtPrice?: number;
  inStock: boolean;
  quantity?: number;
  options?: Record<string, string>;
}

export interface SearchFilters {
  category?: string;
  brand?: string;
  priceMin?: number;
  priceMax?: number;
  inStockOnly?: boolean;
}

export interface SearchQuery {
  text: string;
  filters?: SearchFilters;
  limit?: number;
  offset?: number;
  sortBy?: "relevance" | "price_low" | "price_high" | "newest";
}

export interface SearchResult {
  products: Product[];
  total: number;
  query: SearchQuery;
  timing?: {
    searchMs: number;
  };
}

export interface SearchService {
  search(query: SearchQuery): Promise<SearchResult>;
  suggest?(prefix: string, limit?: number): Promise<string[]>;
}
