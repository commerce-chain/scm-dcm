// Copyright (c) Better Data, Inc.
// SPDX-License-Identifier: Apache-2.0

export interface ImportContext {
  source: string;
  sourceSystem: string;
  managedBy: string;
  importingOrgId: string;
  userId?: string;
}

export interface RawProductPayload {
  externalId: string;
  gtin?: string;
  ndc?: string;
  brandName?: string;
  productName: string;
  description?: string;
  genericName?: string;
  modelNumber?: string;
  attributes?: Record<string, string | number | boolean | null>;
  requiresLotTracking?: boolean;
  requiresExpiryTracking?: boolean;
  isSerialized?: boolean;
}

export interface ProductMasterImportAdapter {
  importOrUpdateProductMaster: (
    payload: RawProductPayload,
    context: ImportContext,
    tx: unknown
  ) => Promise<{
    master: {
      id: string;
      globalSku: string | null;
      gtin: string | null;
      brandName: string | null;
      productName: string;
      description: string | null;
      sourceSystem?: string | null;
      sourceReference?: string | null;
      version?: number;
    };
  }>;
}
