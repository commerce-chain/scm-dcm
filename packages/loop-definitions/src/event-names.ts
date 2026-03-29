// Copyright (c) Better Data, Inc. and contributors
// SPDX-License-Identifier: Apache-2.0

/**
 * Canonical event name constants for the Commerce Chain platform.
 * Convention: {family}.{module}.{snake_case_past_tense}.v{N}
 */
export const EventNames = {
  // SCM Inventory
  INVENTORY_STOCK_RESERVED: "scm.inventory.stock_reserved.v1",
  INVENTORY_STOCK_RESERVATION_FAILED: "scm.inventory.stock_reservation_failed.v1",
  INVENTORY_STOCK_RETURNED: "scm.inventory.stock_returned.v1",

  // SCM Procurement
  PROCUREMENT_PO_CONFIRMED: "scm.procurement.po_confirmed.v1",

  // SCM Execution
  EXECUTION_GOODS_RECEIVED: "scm.execution.goods_received.v1",

  // DCM Demand
  DEMAND_REPLENISHMENT_TRIGGERED: "dcm.demand.replenishment_triggered.v1",
  DEMAND_THRESHOLD_BREACH_DETECTED: "dcm.demand.threshold_breach_detected.v1",

  // DCM Orders
  ORDERS_ORDER_CONFIRMED: "dcm.orders.order_confirmed.v1",
  ORDERS_ORDER_LINE_SHIPPED: "dcm.orders.order_line_shipped.v1",

  // DCM Returns
  RETURNS_RMA_APPROVED: "dcm.returns.rma_approved.v1",
  RETURNS_RETURN_RECEIVED: "dcm.returns.return_received.v1",
  RETURNS_RETURN_CREDITED: "dcm.returns.return_credited.v1"
} as const;

export type EventName = (typeof EventNames)[keyof typeof EventNames];
