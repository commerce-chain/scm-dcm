// Copyright (c) Better Data, Inc. and contributors
// SPDX-License-Identifier: Apache-2.0

import { LoopIds } from "./loop-ids";

/**
 * Backward-compatible alias for canonical loop IDs.
 * Prefer importing `LoopIds` for new code.
 */
export const WellKnownLoops = {
  SCM_PROCUREMENT: LoopIds.SCM_PROCUREMENT,
  SCM_FULFILLMENT: LoopIds.SCM_FULFILLMENT,
  SCM_QUALITY: LoopIds.SCM_QUALITY,
  SCM_REPLENISHMENT: LoopIds.SCM_REPLENISHMENT,
  SCM_INVENTORY: LoopIds.SCM_INVENTORY,
  DCM_ORDER: LoopIds.DCM_ORDER,
  DCM_RETURNS: LoopIds.DCM_RETURNS,
  DCM_DEMAND_SIGNAL: LoopIds.DCM_DEMAND_SIGNAL
} as const;

export type WellKnownLoopId = (typeof WellKnownLoops)[keyof typeof WellKnownLoops];
