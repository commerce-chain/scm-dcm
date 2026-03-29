// Copyright (c) Better Data, Inc.
// SPDX-License-Identifier: Apache-2.0

import { EventNames, LoopIds } from "@betterdata/loop-definitions";
import type { LoopParticipantManifest } from "@betterdata/loop-definitions";

export const executionLoopParticipant: LoopParticipantManifest = {
  moduleId: "scm.execution",
  description: "Warehouse execution events that advance procurement, fulfillment, and quality loops",
  handles: [
    {
      event: EventNames.PROCUREMENT_PO_CONFIRMED,
      loops: [LoopIds.SCM_FULFILLMENT],
      description: "Triggers fulfillment execution on PO confirmation"
    },
    {
      event: EventNames.EXECUTION_GOODS_RECEIVED,
      loops: [LoopIds.SCM_PROCUREMENT, LoopIds.SCM_FULFILLMENT, LoopIds.SCM_QUALITY],
      description: "Updates loop state on goods receipt"
    }
  ]
};

/** @deprecated Prefer `executionLoopParticipant` */
export const ExecutionLoopParticipant = executionLoopParticipant;
