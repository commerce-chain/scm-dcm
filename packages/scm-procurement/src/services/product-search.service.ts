// Copyright (c) Better Data, Inc.
// SPDX-License-Identifier: Apache-2.0

import type { VendorScoringAdapter } from "../adapters/vendor-scoring.adapter";

type ProcurementDbClient = Record<string, any>;

export interface POProductSearchResult {
  productMasterId: string;
  globalSku: string | null;
  gtin: string | null;
  productName: string;
  genericName: string | null;
  requiresLotTracking: boolean;
  requiresExpiryTracking: boolean;
  isActive: boolean;
  category: { id: string; name: string; code: string | null } | null;
  brand: string | null;
  regulatory: {
    isControlled: boolean;
    requiresColdChain: boolean;
    isHazardous: boolean;
  };
  baseUom: { id: string; code: string; name: string } | null;
  packSizes: Array<{ id: string; name: string; quantity: number; uomCode: string }>;
  vendorSource: {
    id: string;
    supplierCode: string | null;
    supplierSku: string | null;
    manufacturerCode: string | null;
    unitPrice: number | null;
    minOrderQuantity: number | null;
    standardLeadTimeDays: number | null;
    preferredUomId: string | null;
  } | null;
  inventory?: {
    onHand: number;
    onOrder: number;
    available: number;
  };
}

export interface POProductSearchOptions {
  query?: string;
  supplierId?: string;
  categoryId?: string;
  includeInactive?: boolean;
  includeInventory?: boolean;
  destinationLocationId?: string;
  limit?: number;
  offset?: number;
  vendorScoringAdapter?: VendorScoringAdapter;
}

export class POProductSearchService {
  static async searchProducts(
    prisma: ProcurementDbClient,
    organizationId: string,
    options: POProductSearchOptions = {}
  ): Promise<{ products: POProductSearchResult[]; total: number }> {
    const query = options.query ?? "";
    const categoryId = options.categoryId;
    const limit = options.limit ?? 50;
    const offset = options.offset ?? 0;

    const where: Record<string, unknown> = {};
    if (query) {
      where.OR = [
        { productName: { contains: query } },
        { globalSku: { contains: query } },
        { gtin: { contains: query } },
        { genericName: { contains: query } }
      ];
    }
    if (categoryId) {
      where.primaryGlobalCategoryId = categoryId;
    }

    const [products, total] = await Promise.all([
      prisma.productMaster.findMany({
        where,
        include: {
          primaryGlobalCategory: { select: { id: true, name: true, code: true } },
          operationalProducts: {
            where: { organizationId },
            take: 1,
            include: { baseUom: { select: { id: true, code: true, name: true } } }
          }
        },
        take: limit,
        skip: offset,
        orderBy: { productName: "asc" }
      }),
      prisma.productMaster.count({ where })
    ]);

    const results: POProductSearchResult[] = products.map((product: any) => ({
      productMasterId: product.id,
      globalSku: product.globalSku,
      gtin: product.gtin,
      productName: product.productName,
      genericName: product.genericName,
      requiresLotTracking: !!product.requiresLotTracking,
      requiresExpiryTracking: !!product.requiresExpiryTracking,
      isActive: true,
      category: product.primaryGlobalCategory || null,
      brand: product.masterAttributes?.brand ?? null,
      regulatory: {
        isControlled: !!product.masterAttributes?.isControlled,
        requiresColdChain: !!product.masterAttributes?.requiresColdChain,
        isHazardous: !!product.masterAttributes?.isHazardous
      },
      baseUom: product.operationalProducts?.[0]?.baseUom || null,
      packSizes: [],
      vendorSource: null
    }));

    return { products: results, total };
  }
}

export default POProductSearchService;
