// Copyright (c) Better Data, Inc.
// SPDX-License-Identifier: Apache-2.0

import type {
  ImportContext,
  ProductMasterImportAdapter,
  RawProductPayload
} from "../adapters/product-master-import.adapter";

export interface VendorProductResolverInput {
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

export interface MarketplaceImportContext {
  vendorOrgId: string;
  platform: "SQUARE" | "SHOPIFY" | "GOOGLE_MERCHANT_CENTER" | "WOOCOMMERCE";
  platformProductId: string;
  userId?: string;
}

export interface ProductMasterResolveResult {
  productMaster: {
    id: string;
    globalSku: string;
    gtin: string | null;
    brandName: string | null;
    productName: string;
    description: string | null;
  };
  wasCreated: boolean;
  wasUpdated: boolean;
}

export interface TransactionalDbClient {
  $transaction: <T>(fn: (tx: unknown) => Promise<T>) => Promise<T>;
}

export async function resolveProductMaster(
  input: VendorProductResolverInput,
  context: MarketplaceImportContext,
  tx: unknown,
  adapter: ProductMasterImportAdapter
): Promise<ProductMasterResolveResult> {
  const importContext: ImportContext = {
    source: "EXTERNAL_API",
    sourceSystem: `marketplace:${context.platform.toLowerCase()}`,
    managedBy: "BETTERDATA",
    importingOrgId: context.vendorOrgId,
    userId: context.userId
  };

  const payload: RawProductPayload = {
    externalId: input.externalId,
    gtin: input.gtin,
    ndc: input.ndc,
    brandName: input.brandName,
    productName: input.productName,
    description: input.description,
    genericName: input.genericName,
    modelNumber: input.modelNumber,
    attributes: {
      ...input.attributes,
      platform: context.platform,
      platformProductId: context.platformProductId,
      importedAt: new Date().toISOString()
    },
    requiresLotTracking: input.requiresLotTracking,
    requiresExpiryTracking: input.requiresExpiryTracking,
    isSerialized: input.isSerialized
  };

  const result = await adapter.importOrUpdateProductMaster(payload, importContext, tx);
  const wasCreated =
    result.master.sourceSystem === importContext.sourceSystem &&
    result.master.sourceReference === input.externalId;
  const wasUpdated = (result.master.version ?? 1) > 1 || !wasCreated;

  return {
    productMaster: {
      id: result.master.id,
      globalSku: result.master.globalSku ?? "",
      gtin: result.master.gtin,
      brandName: result.master.brandName,
      productName: result.master.productName,
      description: result.master.description
    },
    wasCreated,
    wasUpdated: wasUpdated && !wasCreated
  };
}

export async function batchResolveProductMasters(
  inputs: VendorProductResolverInput[],
  context: MarketplaceImportContext,
  db: TransactionalDbClient,
  adapter: ProductMasterImportAdapter
): Promise<ProductMasterResolveResult[]> {
  return db.$transaction(async (tx) => {
    const results: ProductMasterResolveResult[] = [];
    for (const input of inputs) {
      results.push(await resolveProductMaster(input, context, tx, adapter));
    }
    return results;
  });
}

export function toResolverInput(
  vendorProduct: {
    platformProductId?: string;
    platformVariantId?: string;
    gtin?: string;
    vendorSku: string;
    brand?: string;
    name: string;
    description?: string;
    metadata?: Record<string, unknown>;
  },
  _context: MarketplaceImportContext
): VendorProductResolverInput {
  const externalId = vendorProduct.platformProductId || vendorProduct.vendorSku;
  return {
    externalId,
    gtin: vendorProduct.gtin,
    brandName: vendorProduct.brand,
    productName: vendorProduct.name,
    description: vendorProduct.description,
    attributes: {
      ...(vendorProduct.metadata || {}),
      vendorSku: vendorProduct.vendorSku,
      platformVariantId: vendorProduct.platformVariantId
    } as Record<string, string | number | boolean | null>
  };
}
