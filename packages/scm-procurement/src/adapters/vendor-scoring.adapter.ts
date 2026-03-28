// Copyright (c) Better Data, Inc.
// SPDX-License-Identifier: Apache-2.0

export interface VendorScoringInput {
  organizationId: string;
  supplierId: string;
  productMasterId: string;
}

export interface VendorScoringResult {
  supplierId: string;
  score: number;
  reasons?: string[];
}

/**
 * Reserved seam for future proprietary vendor scoring/ranking logic.
 * Not wired in Phase 3B.
 */
export interface VendorScoringAdapter {
  scoreVendor(input: VendorScoringInput): Promise<VendorScoringResult>;
}
