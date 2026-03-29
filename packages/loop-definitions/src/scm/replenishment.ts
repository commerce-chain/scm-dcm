// @license MIT
// Copyright (c) Better Data, Inc.
// SPDX-License-Identifier: MIT

import type { LoopDefinition } from "../types";
import { MeterUnits } from "../meter-units";

export const definition: LoopDefinition = {
  id: "scm.replenishment",
  version: "0.1.0",
  description: "Demand-to-procurement replenishment orchestration loop.",
  domain: "scm",
  states: ["OPEN", "THRESHOLD_BREACHED", "REPLENISHMENT_TRIGGERED", "PO_CONFIRMED", "FAILED", "CLOSED"],
  initialState: "OPEN",
  terminalStates: ["CLOSED"],
  errorStates: ["FAILED"],
  transitions: [
    {
      id: "detect_threshold_breach",
      from: "OPEN",
      to: "THRESHOLD_BREACHED",
      triggeredBy: "dcm.demand.threshold_breach_detected.v1",
      allowedActors: ["automation", "system"],
      guards: [
        {
          id: "stock_below_reorder_point",
          description: "Current stock is below reorder point",
          failureMessage: "Stock is not below reorder point",
          severity: "hard",
          evaluatedBy: "module"
        },
        {
          id: "forecast_confidence_met",
          description: "Demand forecast confidence is above threshold",
          failureMessage: "Forecast confidence is below threshold",
          severity: "soft",
          evaluatedBy: "module"
        }
      ]
    },
    {
      id: "trigger_replenishment",
      from: "THRESHOLD_BREACHED",
      to: "REPLENISHMENT_TRIGGERED",
      triggeredBy: "dcm.demand.replenishment_triggered.v1",
      allowedActors: ["human", "automation", "ai-agent", "system"]
    },
    {
      id: "po_confirmed",
      from: "REPLENISHMENT_TRIGGERED",
      to: "PO_CONFIRMED",
      triggeredBy: "scm.procurement.po_confirmed.v1",
      allowedActors: ["human", "automation", "system"]
    },
    {
      id: "close_replenishment",
      from: "PO_CONFIRMED",
      to: "CLOSED",
      triggeredBy: "scm.execution.goods_received.v1",
      allowedActors: ["human", "automation", "system"]
    }
  ],
  outcome: {
    id: "stock_stabilized",
    description: "Stock level restored to above reorder point without stockout",
    valueUnit: MeterUnits.REPLENISHMENT_COMPLETED,
    measurable: true,
    businessMetrics: [
      {
        id: "stockout_prevented",
        label: "Stockout prevented",
        unit: "boolean",
        improvableByAI: true
      },
      {
        id: "forecast_accuracy",
        label: "Demand forecast accuracy",
        unit: "percentage",
        improvableByAI: true
      },
      {
        id: "replenishment_cycle_time",
        label: "Replenishment cycle time",
        unit: "days",
        improvableByAI: true
      }
    ]
  },
  participants: ["dcm.demand", "scm.procurement"],
  spawnableLoops: ["scm.procurement"]
};

export const replenishment = definition;
