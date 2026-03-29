// @license MIT
// Copyright (c) Better Data, Inc.
// SPDX-License-Identifier: MIT

import type { LoopDefinition } from "../types";
import { MeterUnits } from "../meter-units";

export const definition: LoopDefinition = {
  id: "scm.quality",
  version: "0.1.0",
  description: "Quality incident investigation and resolution loop.",
  domain: "scm",
  states: ["OPEN", "HOLD", "ASSESSMENT", "RESOLVED", "BLOCKED", "CLOSED"],
  initialState: "OPEN",
  terminalStates: ["CLOSED"],
  errorStates: ["BLOCKED"],
  transitions: [
    {
      id: "enter_hold",
      from: "OPEN",
      to: "HOLD",
      triggeredBy: "scm.quality.hold_applied.v1",
      allowedActors: ["human", "automation", "system"]
    },
    {
      id: "start_assessment",
      from: "HOLD",
      to: "ASSESSMENT",
      triggeredBy: "scm.quality.assessment_started.v1",
      allowedActors: ["human", "automation", "system"],
      guards: [
        {
          id: "quality_hold_released",
          description: "Quality hold has been released",
          failureMessage: "Quality hold must be released before transition",
          severity: "hard",
          evaluatedBy: "module"
        },
        {
          id: "lot_not_on_hold",
          description: "Lot is not on active hold",
          failureMessage: "Lot remains on hold",
          severity: "hard",
          evaluatedBy: "module"
        }
      ]
    },
    {
      id: "resolve_quality",
      from: "ASSESSMENT",
      to: "RESOLVED",
      triggeredBy: "scm.quality.resolved.v1",
      allowedActors: ["human", "automation", "ai-agent", "system"]
    },
    {
      id: "close_quality",
      from: "RESOLVED",
      to: "CLOSED",
      triggeredBy: "scm.quality.closed.v1",
      allowedActors: ["human", "automation", "system"]
    }
  ],
  outcome: {
    id: "quality_resolved",
    description: "Quality event investigated, hold released or lot disposed, audit trail complete",
    valueUnit: MeterUnits.QUALITY_RESOLVED,
    measurable: true,
    businessMetrics: [
      {
        id: "hold_duration",
        label: "Hold duration",
        unit: "days",
        improvableByAI: true
      },
      {
        id: "recall_scope_accuracy",
        label: "Recall scope identification accuracy",
        unit: "percentage",
        improvableByAI: true
      }
    ]
  },
  participants: ["scm.inventory", "scm.execution"]
};

export const quality = definition;
