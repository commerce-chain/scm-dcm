// Copyright (c) Better Data, Inc.
// SPDX-License-Identifier: Apache-2.0

export type SortationStatus = "PENDING" | "IN_PROGRESS" | "COMPLETED";

export interface BatchPickLine {
  id: string;
  quantity: number;
}

export interface BatchPickList {
  id: string;
  lines: BatchPickLine[];
}

export interface SortationAssignment {
  orderId: string;
  quantity: number;
}

export interface GenerateBatchPickListInput {
  organizationId: string;
  waveId?: string;
}

export interface ConfirmBatchPickInput {
  batchId: string;
}

export interface StartSortationInput {
  batchId: string;
}

export interface ConfirmSortationInput {
  batchId: string;
}

export interface ShortPickResult {
  success: boolean;
}

export class BatchPickingEntitlementError extends Error {}

export class BatchPickingService {
  static async generateBatchPickList(_input: GenerateBatchPickListInput): Promise<BatchPickList> {
    return { id: `batch_${Date.now()}`, lines: [] };
  }
}

export default BatchPickingService;
