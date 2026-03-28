// Copyright (c) Better Data, Inc.
// SPDX-License-Identifier: Apache-2.0

export interface PutawayInput {
  organizationId: string;
  productMasterId: string;
  quantity: number;
  locationId: string;
}

export interface PutawayResult {
  recommendedBinId: string | null;
  confidence?: number;
}

/**
 * Injection point for proprietary putaway optimization.
 * Default behavior (no adapter): configurable deterministic putaway rules.
 */
export interface PutawayAdapter {
  suggestPutaway(input: PutawayInput): Promise<PutawayResult>;
}
