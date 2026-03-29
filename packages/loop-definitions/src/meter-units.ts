// @license MIT
// Copyright (c) Better Data, Inc.
// SPDX-License-Identifier: MIT

export const MeterUnits = {
  PO_SETTLED: "po_settled",
  REPLENISHMENT_COMPLETED: "replenishment_completed",
  ORDER_COMPLETED: "order_completed",
  RETURN_COMPLETED: "return_completed",
  QUALITY_RESOLVED: "quality_event_resolved",
  FULFILLMENT_COMPLETED: "fulfillment_completed",
  INVENTORY_RECONCILED: "inventory_reconciled",
  SIGNAL_ACTED_ON: "signal_acted_on"
} as const;

export type MeterUnit = (typeof MeterUnits)[keyof typeof MeterUnits];
