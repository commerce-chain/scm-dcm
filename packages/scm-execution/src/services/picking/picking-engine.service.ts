// Copyright (c) Better Data, Inc.
// SPDX-License-Identifier: Apache-2.0

import type { PickOptimizationAdapter } from "../../adapters/pick-optimization.adapter";

type DbClient = Record<string, any>;

export interface PickSuggestion {
  inventoryItemId: string;
  suggestedQty: number;
}

export interface PickLine {
  shipmentItemId: string;
  requestedQty: number;
  pickedQty: number;
  suggestions: PickSuggestion[];
}

export interface PickCommit {
  shipmentItemId: string;
  inventoryItemId: string;
  quantity: number;
}

export interface PickResult {
  success: boolean;
  error?: string;
}

export class PickingEngine {
  static async generatePickList(
    _prisma: DbClient,
    shipmentId: string,
    _organizationId: string,
    optimizationAdapter?: PickOptimizationAdapter
  ): Promise<{ shipmentId: string; lines: PickLine[] }> {
    if (optimizationAdapter) {
      await optimizationAdapter.optimizePickPlan({
        organizationId: _organizationId,
        shipmentId
      });
    }
    return { shipmentId, lines: [] };
  }

  static async commitPicks(
    _prisma: DbClient,
    _shipmentId: string,
    _organizationId: string,
    _userId: string,
    _picks: PickCommit[]
  ): Promise<PickResult> {
    return { success: true };
  }
}

export default PickingEngine;
