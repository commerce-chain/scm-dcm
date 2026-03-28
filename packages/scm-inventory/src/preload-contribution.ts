// Copyright (c) Better Data, Inc.
// SPDX-License-Identifier: Apache-2.0

export type InventoryPreloadContribution = {
  stockLevels: Array<Record<string, unknown>>;
  activeHolds: Array<Record<string, unknown>>;
  activeLots: Array<Record<string, unknown>>;
};

export async function preloadContribution(
  organizationId: string
): Promise<InventoryPreloadContribution> {
  void organizationId;
  return {
    stockLevels: [],
    activeHolds: [],
    activeLots: []
  };
}
