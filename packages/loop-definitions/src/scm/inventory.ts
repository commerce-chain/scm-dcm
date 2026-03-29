// @license MIT
// Copyright (c) Better Data, Inc.
// SPDX-License-Identifier: MIT

import type { LoopDefinition } from "../types";
import { MeterUnits } from "../meter-units";

export const definition: LoopDefinition = {
  id: "scm.inventory",
  version: "0.1.0",
  description: "Inventory balancing and adjustment loop.",
  domain: "scm",
  states: ["OPEN", "ADJUSTED", "RECONCILED", "CLOSED"],
  initialState: "OPEN",
  terminalStates: ["CLOSED"],
  errorStates: [],
  transitions: [
    {
      id: "inventory_adjusted",
      from: "OPEN",
      to: "ADJUSTED",
      triggeredBy: "scm.inventory.adjusted.v1",
      allowedActors: ["human", "automation", "system"]
    },
    {
      id: "inventory_reconciled",
      from: "ADJUSTED",
      to: "RECONCILED",
      triggeredBy: "scm.inventory.reconciled.v1",
      allowedActors: ["human", "automation", "system"]
    },
    {
      id: "close_inventory",
      from: "RECONCILED",
      to: "CLOSED",
      triggeredBy: "scm.inventory.closed.v1",
      allowedActors: ["human", "automation", "system"]
    }
  ],
  outcome: {
    id: "inventory_reconciled",
    description: "Inventory state reconciled and published",
    valueUnit: MeterUnits.INVENTORY_RECONCILED,
    measurable: true,
    businessMetrics: [
      {
        id: "cycle_count_accuracy",
        label: "Cycle count accuracy",
        unit: "percentage",
        improvableByAI: true
      },
      {
        id: "adjustment_latency",
        label: "Adjustment latency",
        unit: "days",
        improvableByAI: true
      }
    ]
  },
  participants: ["scm.inventory"]
};

export const inventory = definition;
