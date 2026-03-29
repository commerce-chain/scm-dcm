// @license MIT
// Copyright (c) Better Data, Inc.
// SPDX-License-Identifier: MIT

import type { LoopDefinition } from "../types";
import { MeterUnits } from "../meter-units";

export const definition: LoopDefinition = {
  id: "dcm.demand-signal",
  version: "0.1.0",
  description: "Demand-signal detection loop that can trigger replenishment.",
  domain: "dcm",
  states: ["OPEN", "SIGNAL_RECEIVED", "EVALUATED", "TRIGGERED", "CLOSED"],
  initialState: "OPEN",
  terminalStates: ["CLOSED"],
  errorStates: [],
  transitions: [
    {
      id: "signal_received",
      from: "OPEN",
      to: "SIGNAL_RECEIVED",
      triggeredBy: "dcm.demand.signal_received.v1",
      allowedActors: ["automation", "system", "webhook"]
    },
    {
      id: "signal_evaluated",
      from: "SIGNAL_RECEIVED",
      to: "EVALUATED",
      triggeredBy: "dcm.demand.signal_evaluated.v1",
      allowedActors: ["automation", "system", "ai-agent"]
    },
    {
      id: "signal_triggered",
      from: "EVALUATED",
      to: "TRIGGERED",
      triggeredBy: "dcm.demand.replenishment_triggered.v1",
      allowedActors: ["automation", "system"]
    },
    {
      id: "close_signal",
      from: "TRIGGERED",
      to: "CLOSED",
      triggeredBy: "dcm.demand.signal_closed.v1",
      allowedActors: ["automation", "system"]
    }
  ],
  outcome: {
    id: "signal_acted_on",
    description: "Demand signal evaluated and actioned",
    valueUnit: MeterUnits.SIGNAL_ACTED_ON,
    measurable: true,
    businessMetrics: [
      {
        id: "signal_precision",
        label: "Signal precision",
        unit: "percentage",
        improvableByAI: true
      },
      {
        id: "signal_to_action_latency",
        label: "Signal to action latency",
        unit: "days",
        improvableByAI: true
      }
    ]
  },
  participants: ["dcm.demand"],
  spawnableLoops: ["scm.replenishment"]
};

export const demandSignal = definition;
