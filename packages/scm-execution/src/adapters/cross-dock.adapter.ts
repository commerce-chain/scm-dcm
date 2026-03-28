// Copyright (c) Better Data, Inc.
// SPDX-License-Identifier: Apache-2.0

export interface CrossDockInput {
  organizationId: string;
  inboundReceiptId: string;
  productMasterId: string;
  quantity: number;
}

export interface CrossDockResult {
  action: "CROSS_DOCK" | "PUTAWAY" | "PUTAWAY_WITH_QC" | "BLOCKED";
  reason: string;
}

/**
 * Injection point for proprietary cross-dock routing/scoring.
 * Default behavior (no adapter): deterministic threshold/rule evaluation.
 */
export interface CrossDockAdapter {
  evaluateCrossDock(input: CrossDockInput): Promise<CrossDockResult>;
}
