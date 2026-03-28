// Copyright (c) Better Data, Inc.
// SPDX-License-Identifier: Apache-2.0

export interface PickOptimizationInput {
  organizationId: string;
  shipmentId: string;
  strategy?: string;
}

export interface PickOptimizationResult {
  orderedPickIds: string[];
  notes?: string[];
}

/**
 * Injection point for proprietary picking optimization.
 * Default behavior (no adapter): deterministic FEFO/rules-based picking.
 */
export interface PickOptimizationAdapter {
  optimizePickPlan(input: PickOptimizationInput): Promise<PickOptimizationResult>;
}
