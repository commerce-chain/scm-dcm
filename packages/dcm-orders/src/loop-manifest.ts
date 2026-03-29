// Copyright (c) Better Data, Inc.
// SPDX-License-Identifier: Apache-2.0

import { EventNames, LoopIds } from "@betterdata/loop-definitions";
import type { LoopParticipantManifest } from "@betterdata/loop-definitions";

export type OrderLoopParticipant = LoopParticipantManifest;

export const orderLoopParticipant: LoopParticipantManifest = {
  moduleId: "dcm.orders",
  description: "Order lifecycle reactions for allocation and shipment",
  handles: [
    { event: EventNames.ORDERS_ORDER_CONFIRMED, loops: [LoopIds.DCM_ORDER] },
    { event: EventNames.INVENTORY_STOCK_RESERVED, loops: [LoopIds.DCM_ORDER] },
    { event: EventNames.INVENTORY_STOCK_RESERVATION_FAILED, loops: [LoopIds.DCM_ORDER] },
    { event: EventNames.ORDERS_ORDER_LINE_SHIPPED, loops: [LoopIds.DCM_ORDER] }
  ]
};
