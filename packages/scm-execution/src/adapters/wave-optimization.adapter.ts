// Copyright (c) Better Data, Inc.
// SPDX-License-Identifier: Apache-2.0

export interface WaveOptimizationInput {
  organizationId: string;
  shipmentIds: string[];
  criteria?: Record<string, unknown>;
}

export interface WaveOptimizationResult {
  groupedShipmentIds: string[][];
  rationale?: string[];
}

/**
 * Injection point for proprietary wave batching optimization.
 * Default behavior (no adapter): standard rules-based grouping in WaveService.
 */
export interface WaveOptimizationAdapter {
  optimizeWave(input: WaveOptimizationInput): Promise<WaveOptimizationResult>;
}
