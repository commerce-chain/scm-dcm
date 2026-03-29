// Copyright (c) Better Data, Inc. and contributors
// SPDX-License-Identifier: Apache-2.0

/**
 * Canonical loop IDs for the Better Data Commerce Chain platform.
 * Import from here instead of duplicating strings in each module.
 */
export const LoopIds = {
  SCM_PROCUREMENT: "scm.procurement",
  SCM_FULFILLMENT: "scm.fulfillment",
  SCM_QUALITY: "scm.quality",
  SCM_REPLENISHMENT: "scm.replenishment",
  SCM_INVENTORY: "scm.inventory",
  SCM_EXECUTION: "scm.execution",

  /** LoopDefinition id for demand-signal (see dcm/demand-signal.ts). */
  DCM_DEMAND_SIGNAL: "dcm.demand-signal",
  /**
   * Participant / routing id used by demand and replenishment definitions.
   * TODO: align naming with DCM_DEMAND_SIGNAL loop id where possible.
   */
  DCM_DEMAND: "dcm.demand",
  DCM_ORDER: "dcm.order",
  DCM_RETURNS: "dcm.returns",
  DCM_CHANNELS: "dcm.channels"
} as const;

export type LoopId = (typeof LoopIds)[keyof typeof LoopIds];
