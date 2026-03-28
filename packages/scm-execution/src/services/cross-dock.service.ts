// Copyright (c) Better Data, Inc.
// SPDX-License-Identifier: Apache-2.0

import type { CrossDockAdapter } from "../adapters/cross-dock.adapter";

export class CrossDockService {
  static getConfiguration(): Record<string, unknown> {
    return { mode: "rules" };
  }

  static isCrossDockCapable(): boolean {
    return true;
  }

  static async registerDemand(): Promise<{ success: boolean }> {
    return { success: true };
  }

  static async getUnfulfilledDemand(): Promise<Array<Record<string, unknown>>> {
    return [];
  }

  static async evaluateReceipt(
    input: {
      organizationId: string;
      receiptId: string;
      productMasterId: string;
      quantity: number;
    },
    adapter?: CrossDockAdapter
  ): Promise<{ action: string; reason: string }> {
    return this.evaluate(input, adapter);
  }

  static async createAllocations(): Promise<{ created: number }> {
    return { created: 0 };
  }

  static async cancelAllocation(): Promise<{ success: boolean }> {
    return { success: true };
  }

  static async getReceiptAllocationSummary(): Promise<Record<string, unknown>> {
    return {};
  }

  static async getAllocationsForOutbound(): Promise<Array<Record<string, unknown>>> {
    return [];
  }

  static async evaluate(
    input: {
      organizationId: string;
      receiptId: string;
      productMasterId: string;
      quantity: number;
    },
    adapter?: CrossDockAdapter
  ): Promise<{ action: string; reason: string }> {
    if (adapter) {
      const result = await adapter.evaluateCrossDock({
        organizationId: input.organizationId,
        inboundReceiptId: input.receiptId,
        productMasterId: input.productMasterId,
        quantity: input.quantity
      });
      return { action: result.action, reason: result.reason };
    }
    return { action: "PUTAWAY", reason: "Default deterministic rule path" };
  }
}

export const getConfiguration = CrossDockService.getConfiguration.bind(CrossDockService);
export const isCrossDockCapable = CrossDockService.isCrossDockCapable.bind(CrossDockService);
export const registerDemand = CrossDockService.registerDemand.bind(CrossDockService);
export const getUnfulfilledDemand = CrossDockService.getUnfulfilledDemand.bind(CrossDockService);
export const evaluateReceipt = CrossDockService.evaluateReceipt.bind(CrossDockService);
export const createAllocations = CrossDockService.createAllocations.bind(CrossDockService);
export const cancelAllocation = CrossDockService.cancelAllocation.bind(CrossDockService);
export const getReceiptAllocationSummary =
  CrossDockService.getReceiptAllocationSummary.bind(CrossDockService);
export const getAllocationsForOutbound =
  CrossDockService.getAllocationsForOutbound.bind(CrossDockService);

export default CrossDockService;
