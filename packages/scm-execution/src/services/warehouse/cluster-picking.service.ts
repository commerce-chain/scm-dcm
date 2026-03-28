// Copyright (c) Better Data, Inc.
// SPDX-License-Identifier: Apache-2.0

export const CLUSTER_PICKING_ENABLED = "workflow.wms.cluster_picking";

export type CartStatus = "AVAILABLE" | "ASSIGNED" | "IN_USE";
export type CartBinStatus = "EMPTY" | "ACTIVE";
export type ScanStep = "PICK" | "VERIFY" | "PLACE";
export type VerificationResult = "VERIFIED" | "MISMATCH";

export interface CartWithBins {
  id: string;
  bins: CartBinInfo[];
}

export interface CartBinInfo {
  id: string;
  status: CartBinStatus;
}

export interface CreateCartInput {
  locationId: string;
}

export interface AssignCartInput {
  cartId: string;
  pickerId: string;
}

export interface CreateClusterBatchInput {
  organizationId: string;
}

export interface ClusterBatchResult {
  id: string;
}

export interface ScanVerificationInput {
  taskId: string;
}

export interface ScanVerificationResult {
  success: boolean;
}

export interface ConfirmSlotPlacementInput {
  cartId: string;
  slotId: string;
}

export class ClusterPickingEntitlementError extends Error {}

export class ClusterPickingService {
  static async createClusterBatch(_input: CreateClusterBatchInput): Promise<ClusterBatchResult> {
    return { id: `cluster_${Date.now()}` };
  }
}

export default ClusterPickingService;
