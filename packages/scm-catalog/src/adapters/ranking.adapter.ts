// Copyright (c) Better Data, Inc.
// SPDX-License-Identifier: Apache-2.0

export interface RankingUserLocation {
  lat: number;
  lng: number;
}

export interface RankingSearchResultRow {
  listingId: string;
  productMasterId: string;
  vendorOrgId: string;
  vendorName: string;
  vendorRating?: number | string | null;
  platform?: string | null;
  merchantId?: string | null;
  platformProductId?: string | null;
  platformVariantId?: string | null;
  price: number | string;
  currency?: string;
  authenticated: boolean | number;
  inStock: boolean | number;
  availableQuantity?: number | null;
  locationLat?: number | string | null;
  locationLng?: number | string | null;
  city?: string | null;
  state?: string | null;
  distance?: number | null;
  relevance?: number | null;
}

export interface RankedListing {
  id: string;
  vendorOrgId: string;
  vendorName: string;
  vendorRating?: number;
  platform?: string;
  merchantId?: string;
  platformProductId?: string;
  platformVariantId?: string;
  price: number;
  currency: string;
  authenticated: boolean;
  signalTagId?: string;
  inStock: boolean;
  availableQuantity?: number;
  locationData?: {
    city?: string;
    state?: string;
    lat?: number;
    lng?: number;
  };
  shippingOptions: Array<{
    method: string;
    cost: number;
    estimatedDays: number;
  }>;
  pickupAvailable: boolean;
  freeShipping: boolean;
  rankScore: number;
  rankFactors: {
    distance: number;
    authentication: number;
    price: number;
    vendorRating: number;
    shipping: number;
    total: number;
  };
  distance?: number;
  relevanceScore: number;
}

export interface RankingAdapter {
  rankListings: (
    rows: RankingSearchResultRow[],
    context: {
      userLocation?: RankingUserLocation;
      sortBy?: "relevance" | "price_low" | "price_high" | "distance";
    }
  ) => RankedListing[];
}
