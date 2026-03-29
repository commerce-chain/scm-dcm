// Copyright (c) Better Data, Inc.
// SPDX-License-Identifier: Apache-2.0

import { EventNames, LoopIds } from "@betterdata/loop-definitions";
import type { LoopParticipantManifest } from "@betterdata/loop-definitions";

export type InventoryLoopParticipant = LoopParticipantManifest;

export const inventoryLoopParticipant: LoopParticipantManifest = {
  moduleId: "scm.inventory",
  description: "Stock, reservations, and lot reactions for SCM/DCM loops",
  handles: [
    {
      event: EventNames.EXECUTION_GOODS_RECEIVED,
      loops: [LoopIds.SCM_PROCUREMENT, LoopIds.SCM_FULFILLMENT],
      description: "Updates inventory on goods receipt"
    },
    {
      event: EventNames.INVENTORY_STOCK_RESERVED,
      loops: [LoopIds.SCM_FULFILLMENT],
      description: "Notifies fulfillment when stock is reserved"
    }
  ]
};
