// @license MIT
// Copyright (c) Better Data, Inc.
// SPDX-License-Identifier: MIT

import type { LoopDefinition } from "../types";
import { MeterUnits } from "../meter-units";

export const definition: LoopDefinition = {
  id: "scm.fulfillment",
  version: "0.1.0",
  description: "Fulfillment loop covering reservation, pick, pack, ship and closure.",
  domain: "scm",
  states: ["OPEN", "RESERVED", "PICKED", "PACKED", "SHIPPED", "RESERVATION_FAILED", "CLOSED"],
  initialState: "OPEN",
  terminalStates: ["CLOSED"],
  errorStates: ["RESERVATION_FAILED"],
  transitions: [
    {
      id: "reserve_stock",
      from: "OPEN",
      to: "RESERVED",
      triggeredBy: "scm.inventory.stock_reserved.v1",
      allowedActors: ["human", "automation", "system"]
    },
    {
      id: "reservation_failed",
      from: "OPEN",
      to: "RESERVATION_FAILED",
      triggeredBy: "scm.inventory.stock_reservation_failed.v1",
      allowedActors: ["automation", "system"]
    },
    {
      id: "pick_shipment",
      from: "RESERVED",
      to: "PICKED",
      triggeredBy: "scm.execution.shipment_picked.v1",
      allowedActors: ["human", "automation", "system"]
    },
    {
      id: "pack_shipment",
      from: "PICKED",
      to: "PACKED",
      triggeredBy: "scm.execution.shipment_packed.v1",
      allowedActors: ["human", "automation", "system"]
    },
    {
      id: "ship_shipment",
      from: "PACKED",
      to: "SHIPPED",
      triggeredBy: "scm.execution.shipment_shipped.v1",
      allowedActors: ["human", "automation", "webhook", "system"]
    },
    {
      id: "close_fulfillment",
      from: "SHIPPED",
      to: "CLOSED",
      triggeredBy: "dcm.orders.order_line_shipped.v1",
      allowedActors: ["human", "automation", "ai-agent", "system"]
    }
  ],
  outcome: {
    id: "fulfillment_completed",
    description: "Order line fulfilled and confirmed as shipped",
    valueUnit: MeterUnits.FULFILLMENT_COMPLETED,
    measurable: true,
    businessMetrics: [
      {
        id: "pick_pack_cycle_time",
        label: "Pick-pack cycle time",
        unit: "days",
        improvableByAI: true
      },
      {
        id: "on_time_ship_rate",
        label: "On-time ship rate",
        unit: "percentage",
        improvableByAI: true
      }
    ]
  },
  participants: ["scm.inventory", "scm.execution", "dcm.orders"]
};

export const fulfillment = definition;
