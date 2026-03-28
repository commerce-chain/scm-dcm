// Copyright (c) Better Data, Inc.
// SPDX-License-Identifier: Apache-2.0

export type CatalogPreloadContribution = {
  products: Array<Record<string, unknown>>;
  categories: Array<Record<string, unknown>>;
  suppliers: Array<Record<string, unknown>>;
};

export async function preloadContribution(
  organizationId: string
): Promise<CatalogPreloadContribution> {
  void organizationId;
  return {
    products: [],
    categories: [],
    suppliers: []
  };
}
