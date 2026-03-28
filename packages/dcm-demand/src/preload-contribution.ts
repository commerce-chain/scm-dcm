// Copyright (c) Better Data, Inc.
// SPDX-License-Identifier: Apache-2.0

export type DemandPreloadContribution = {
  activeDemandSignals: Array<Record<string, unknown>>;
  replenishmentQueue: Array<Record<string, unknown>>;
  thresholdBreaches: Array<Record<string, unknown>>;
};

export interface DemandPreloadAdapter {
  getActiveDemandSignals?: (organizationId: string) => Promise<Array<Record<string, unknown>>>;
  getReplenishmentQueue?: (organizationId: string) => Promise<Array<Record<string, unknown>>>;
  getThresholdBreaches?: (organizationId: string) => Promise<Array<Record<string, unknown>>>;
}

export async function preloadContribution(
  organizationId: string,
  adapter?: DemandPreloadAdapter
): Promise<DemandPreloadContribution> {
  return {
    activeDemandSignals: adapter?.getActiveDemandSignals
      ? await adapter.getActiveDemandSignals(organizationId)
      : [],
    replenishmentQueue: adapter?.getReplenishmentQueue
      ? await adapter.getReplenishmentQueue(organizationId)
      : [],
    thresholdBreaches: adapter?.getThresholdBreaches
      ? await adapter.getThresholdBreaches(organizationId)
      : []
  };
}
