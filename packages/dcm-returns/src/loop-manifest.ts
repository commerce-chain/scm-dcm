// Copyright (c) Better Data, Inc.
// SPDX-License-Identifier: Apache-2.0

import { EventNames, LoopIds } from "@betterdata/loop-definitions";
import type { LoopParticipantManifest } from "@betterdata/loop-definitions";

export type ReturnsLoopParticipant = LoopParticipantManifest;

export const returnsLoopParticipant: LoopParticipantManifest = {
  moduleId: "dcm.returns",
  description: "Returns and credit loop participation",
  handles: [
    { event: EventNames.RETURNS_RMA_APPROVED, loops: [LoopIds.DCM_RETURNS] },
    { event: EventNames.RETURNS_RETURN_RECEIVED, loops: [LoopIds.DCM_RETURNS] },
    { event: EventNames.INVENTORY_STOCK_RETURNED, loops: [LoopIds.DCM_RETURNS] },
    { event: EventNames.RETURNS_RETURN_CREDITED, loops: [LoopIds.DCM_RETURNS] }
  ]
};
