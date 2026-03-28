// Copyright (c) Better Data, Inc.
// SPDX-License-Identifier: Apache-2.0

import { OrderQueryService } from "./services/order-query.service";

type DcmOrdersDbClient = Record<string, unknown>;

export type OrdersPreloadContribution = {
  openOrders: Array<Record<string, unknown>>;
  pendingAllocations: Array<Record<string, unknown>>;
  allocationFailures: Array<Record<string, unknown>>;
};

export interface OrdersPreloadAdapter {
  getOpenOrders?: (organizationId: string) => Promise<Array<Record<string, unknown>>>;
  getPendingAllocations?: (organizationId: string) => Promise<Array<Record<string, unknown>>>;
  getAllocationFailures?: (organizationId: string) => Promise<Array<Record<string, unknown>>>;
}

export async function preloadContribution(
  organizationId: string,
  prisma?: DcmOrdersDbClient,
  adapter?: OrdersPreloadAdapter
): Promise<OrdersPreloadContribution> {
  if (adapter) {
    return {
      openOrders: adapter.getOpenOrders ? await adapter.getOpenOrders(organizationId) : [],
      pendingAllocations: adapter.getPendingAllocations
        ? await adapter.getPendingAllocations(organizationId)
        : [],
      allocationFailures: adapter.getAllocationFailures
        ? await adapter.getAllocationFailures(organizationId)
        : []
    };
  }
  if (!prisma) {
    return { openOrders: [], pendingAllocations: [], allocationFailures: [] };
  }
  const db = prisma as any;
  const [openOrders, pendingAllocations, allocationFailures] = await Promise.all([
    OrderQueryService.getOpenOrders(db, organizationId),
    OrderQueryService.getPendingAllocations(db, organizationId),
    OrderQueryService.getAllocationFailures(db, organizationId)
  ]);
  return {
    openOrders,
    pendingAllocations,
    allocationFailures
  };
}
