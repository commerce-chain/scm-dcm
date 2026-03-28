// Copyright (c) Better Data, Inc.
// SPDX-License-Identifier: Apache-2.0

export type InventoryLoopEvent =
  | "scm.execution.GoodsReceived"
  | "scm.inventory.StockReserved";

export type InventoryLoopParticipant = {
  module: "scm-inventory";
  handles: Array<{
    event: InventoryLoopEvent;
    loops: string[];
  }>;
};

export const inventoryLoopParticipant: InventoryLoopParticipant = {
  module: "scm-inventory",
  handles: [
    {
      event: "scm.execution.GoodsReceived",
      loops: ["scm.procurement", "scm.fulfillment"]
    },
    {
      event: "scm.inventory.StockReserved",
      loops: ["scm.fulfillment"]
    }
  ]
};
