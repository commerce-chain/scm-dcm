// Copyright (c) Better Data, Inc.
// SPDX-License-Identifier: Apache-2.0

import { EventNames, LoopIds } from "@betterdata/loop-definitions";
import type { LoopParticipantManifest } from "@betterdata/loop-definitions";

export type DemandLoopParticipant = LoopParticipantManifest;

export const demandLoopParticipant: LoopParticipantManifest = {
  moduleId: "dcm.demand",
  description: "Demand signals and replenishment triggers",
  handles: [
    {
      event: EventNames.DEMAND_REPLENISHMENT_TRIGGERED,
      loops: [LoopIds.DCM_DEMAND],
      description: "Propagates replenishment into demand loop orchestration"
    },
    {
      event: EventNames.DEMAND_THRESHOLD_BREACH_DETECTED,
      loops: [LoopIds.DCM_DEMAND],
      description: "Threshold monitoring for demand-driven replenishment"
    }
  ]
};
