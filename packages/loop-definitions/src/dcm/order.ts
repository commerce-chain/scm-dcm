// @license MIT
// Copyright (c) Better Data, Inc.
// SPDX-License-Identifier: MIT

import type { LoopDefinition } from "../types";
import { MeterUnits } from "../meter-units";

export const definition: LoopDefinition = {
  id: "dcm.order",
  version: "0.1.0",
  description: "DCM order loop for confirmation, allocation, shipping and closure.",
  domain: "dcm",
  states: ["OPEN", "CONFIRMED", "ALLOCATION_PENDING", "ALLOCATED", "SHIPPED", "ALLOCATION_FAILED", "CANCELLED", "CLOSED"],
  initialState: "OPEN",
  terminalStates: ["CLOSED"],
  errorStates: ["ALLOCATION_FAILED", "CANCELLED"],
  transitions: [
    {
      id: "confirm_order",
      from: "OPEN",
      to: "CONFIRMED",
      triggeredBy: "dcm.orders.order_confirmed.v1",
      allowedActors: ["human", "automation", "system"]
    },
    {
      id: "request_allocation",
      from: "CONFIRMED",
      to: "ALLOCATION_PENDING",
      triggeredBy: "dcm.orders.order_line_allocation_requested.v1",
      allowedActors: ["automation", "system"]
    },
    {
      id: "allocation_succeeded",
      from: "ALLOCATION_PENDING",
      to: "ALLOCATED",
      triggeredBy: "scm.inventory.stock_reserved.v1",
      allowedActors: ["automation", "system"]
    },
    {
      id: "allocation_failed",
      from: "ALLOCATION_PENDING",
      to: "ALLOCATION_FAILED",
      triggeredBy: "scm.inventory.stock_reservation_failed.v1",
      allowedActors: ["automation", "system"]
    },
    {
      id: "line_shipped",
      from: "ALLOCATED",
      to: "SHIPPED",
      triggeredBy: "dcm.orders.order_line_shipped.v1",
      allowedActors: ["human", "automation", "system"]
    },
    {
      id: "close_order",
      from: "SHIPPED",
      to: "CLOSED",
      triggeredBy: "dcm.orders.order_line_shipped.v1",
      allowedActors: ["human", "automation", "ai-agent", "system"],
      guards: [
        {
          id: "dcm.order.guard.close_loop",
          description: "Order is eligible for closure",
          failureMessage: "Order cannot be closed yet",
          severity: "hard",
          evaluatedBy: "module"
        }
      ]
    },
    {
      id: "cancel_confirmed",
      from: "CONFIRMED",
      to: "CANCELLED",
      triggeredBy: "dcm.orders.order_cancelled.v1",
      allowedActors: ["human", "automation", "system"]
    },
    {
      id: "cancel_allocated",
      from: "ALLOCATED",
      to: "CANCELLED",
      triggeredBy: "dcm.orders.order_cancelled.v1",
      allowedActors: ["human", "automation", "system"]
    }
  ],
  outcome: {
    id: "order_completed",
    description: "Order line completed and financially recognized",
    valueUnit: MeterUnits.ORDER_COMPLETED,
    measurable: true,
    businessMetrics: [
      {
        id: "allocation_success_rate",
        label: "Allocation success rate",
        unit: "percentage",
        improvableByAI: true
      },
      {
        id: "order_cycle_time",
        label: "Order cycle time",
        unit: "days",
        improvableByAI: true
      }
    ]
  },
  participants: ["dcm.orders", "scm.inventory", "scm.execution"]
};

export const order = definition;
