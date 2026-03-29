// Copyright (c) Better Data, Inc.
// SPDX-License-Identifier: Apache-2.0

import { EventNames, LoopIds } from "@betterdata/loop-definitions";
import type { LoopParticipantManifest } from "@betterdata/loop-definitions";

export type ProcurementLoopParticipant = LoopParticipantManifest;

export const procurementLoopParticipant: LoopParticipantManifest = {
  moduleId: "scm.procurement",
  description: "Purchase order and receiving loop participation",
  handles: [
    { event: EventNames.PROCUREMENT_PO_CONFIRMED, loops: [LoopIds.SCM_PROCUREMENT] },
    { event: EventNames.EXECUTION_GOODS_RECEIVED, loops: [LoopIds.SCM_PROCUREMENT] }
  ]
};
