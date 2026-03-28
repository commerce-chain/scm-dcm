// Copyright (c) Better Data, Inc.
// SPDX-License-Identifier: Apache-2.0

import type { CentralizedListing, FederationMerchantTier } from "../services/offer-normalizer.service";

export interface TrustScoringAdapter {
  centralizedTrustScore: (listing: CentralizedListing) => number;
  federationTrustScore: (tier?: FederationMerchantTier) => number;
}
