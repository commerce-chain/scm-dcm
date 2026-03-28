// Copyright (c) Better Data, Inc.
// SPDX-License-Identifier: Apache-2.0

export interface ProductMatcherInput {
  vendorOrgId: string;
  gtin?: string;
  vendorSku: string;
  brand?: string;
  name: string;
  description?: string;
  metadata?: Record<string, unknown>;
}

export interface ProductMatcherResult {
  productMasterId: string;
  isNewProduct: boolean;
  matchConfidence: number;
  matchMethod: "gtin" | "brand_name_fuzzy" | "manual" | "new";
}

export interface ProductMatcherAdapter {
  matchOrCreateProduct: (input: ProductMatcherInput) => Promise<ProductMatcherResult>;
}
