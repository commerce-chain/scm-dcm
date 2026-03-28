// Copyright (c) Better Data, Inc.
// SPDX-License-Identifier: Apache-2.0

import type { PutawayAdapter } from "../../adapters/putaway.adapter";

export const SMART_PUTAWAY_ENABLED = "workflow.wms.smart_putaway";

export type VelocityClass = "LOW" | "MEDIUM" | "HIGH";

export interface PutawayContext {
  organizationId: string;
  locationId: string;
  productMasterId: string;
  quantity: number;
}

export interface HoldInfo {
  onHold: boolean;
}

export interface BinSuggestion {
  binId: string;
  score: number;
}

export interface SuggestionFactor {
  key: string;
  value: number;
}

export interface PutawaySuggestionResult {
  suggestions: BinSuggestion[];
}

export interface PutawayConfirmation {
  accepted: boolean;
}

export class PutawaySuggestionService {
  async suggest(
    context: PutawayContext,
    adapter?: PutawayAdapter
  ): Promise<PutawaySuggestionResult> {
    if (adapter) {
      const result = await adapter.suggestPutaway({
        organizationId: context.organizationId,
        locationId: context.locationId,
        productMasterId: context.productMasterId,
        quantity: context.quantity
      });
      return {
        suggestions: result.recommendedBinId
          ? [{ binId: result.recommendedBinId, score: result.confidence ?? 1 }]
          : []
      };
    }
    return { suggestions: [] };
  }
}

export const putawaySuggestionService = new PutawaySuggestionService();
