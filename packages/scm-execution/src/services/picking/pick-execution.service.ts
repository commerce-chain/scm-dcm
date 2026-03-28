// Copyright (c) Better Data, Inc.
// SPDX-License-Identifier: Apache-2.0

export type PickStrategy = "FIFO" | "FEFO" | "PRIORITY";
export type PickBatchStatus = "DRAFT" | "ACTIVE" | "COMPLETED" | "CANCELLED";
export type PickTaskStatus = "PENDING" | "IN_PROGRESS" | "COMPLETED" | "BLOCKED";
export type PickLineStatus = "PENDING" | "PICKED" | "SHORT" | "EXCEPTION";
export type PickExceptionType = "DAMAGE" | "MISSING" | "HOLD" | "COUNT_MISMATCH";
export type ExceptionStatus = "OPEN" | "ACKNOWLEDGED" | "RESOLVED";
export type ExceptionResolution = "SUBSTITUTE" | "BACKORDER" | "CANCEL" | "RECOUNT";

export interface CreateBatchInput {
  organizationId: string;
  waveId?: string;
  strategy?: PickStrategy;
}

export interface CreateTaskInput {
  organizationId: string;
  batchId: string;
}

export interface CreateTaskLineInput {
  taskId: string;
  shipmentItemId: string;
  quantity: number;
}

export interface AssignTaskInput {
  taskId: string;
  pickerId: string;
}

export interface ConfirmPickInput {
  taskLineId: string;
  pickedQty: number;
}

export interface ReportExceptionInput {
  taskLineId: string;
  exceptionType: PickExceptionType;
  note?: string;
}

export interface ResolveExceptionInput {
  exceptionId: string;
  resolution: ExceptionResolution;
}

export class PickExecutionService {
  static async createBatch(input: CreateBatchInput): Promise<{ id: string; batchNumber: string }> {
    void input;
    return {
      id: `batch_${Date.now()}`,
      batchNumber: `PB-${Date.now()}`
    };
  }
}

export default PickExecutionService;
