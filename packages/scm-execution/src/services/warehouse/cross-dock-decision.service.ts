// Copyright (c) Better Data, Inc.
// SPDX-License-Identifier: Apache-2.0

import type { CrossDockAdapter } from "../../adapters/cross-dock.adapter";

export interface CrossDockDecision {
  isEligible: boolean;
  reason: string;
  decision: "CROSS_DOCK" | "PUTAWAY" | "PUTAWAY_WITH_QC" | "BLOCKED";
}

export interface ReceiptEvaluationContext {
  organizationId: string;
  receiptId: string;
  productMasterId: string;
  receivedQty: number;
}

export class CrossDockEntitlementError extends Error {}

export class CrossDockDecisionService {
  static async evaluateReceipt(
    context: ReceiptEvaluationContext,
    adapter?: CrossDockAdapter
  ): Promise<CrossDockDecision> {
    if (adapter) {
      const result = await adapter.evaluateCrossDock({
        organizationId: context.organizationId,
        inboundReceiptId: context.receiptId,
        productMasterId: context.productMasterId,
        quantity: context.receivedQty
      });
      return {
        isEligible: result.action === "CROSS_DOCK",
        reason: result.reason,
        decision: result.action
      };
    }
    return {
      isEligible: false,
      reason: "Default rule path",
      decision: "PUTAWAY"
    };
  }
}

export default CrossDockDecisionService;
