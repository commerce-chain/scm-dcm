// Copyright (c) Better Data, Inc.
// SPDX-License-Identifier: Apache-2.0

import type { NormalizedOffer } from "../services/offer-normalizer.service";

export interface HybridSearchQuery {
  query: string;
  organizationId?: string;
  filters?: {
    brand?: string;
    category?: string;
    priceMin?: number;
    priceMax?: number;
    inStockOnly?: boolean;
    authenticatedOnly?: boolean;
  };
  userLocation?: { lat: number; lng: number };
  limit?: number;
}

export interface HybridSearchResult {
  offers: NormalizedOffer[];
  sources: {
    centralized: number;
    federated: number;
    merchants: number;
  };
  timing: {
    totalMs: number;
    federationMs?: number;
    centralizedMs?: number;
  };
}

export interface HybridSearchAdapter {
  search: (query: HybridSearchQuery) => Promise<HybridSearchResult>;
}
