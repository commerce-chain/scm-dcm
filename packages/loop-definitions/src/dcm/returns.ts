// @license MIT
// Copyright (c) Better Data, Inc.
// SPDX-License-Identifier: MIT

import type { LoopDefinition } from "../types";
import { MeterUnits } from "../meter-units";

export const definition: LoopDefinition = {
  id: "dcm.returns",
  version: "0.1.0",
  description: "DCM returns loop for RMA, condition handling, restock and closure.",
  domain: "dcm",
  states: ["OPEN", "RMA_APPROVED", "RMA_REJECTED", "RECEIPT_PENDING", "RECEIVED", "DAMAGED_HOLD", "RESTOCKED", "CREDITED", "CLOSED"],
  initialState: "OPEN",
  terminalStates: ["CLOSED"],
  errorStates: ["RMA_REJECTED", "DAMAGED_HOLD"],
  transitions: [
    {
      id: "approve_rma",
      from: "OPEN",
      to: "RMA_APPROVED",
      triggeredBy: "dcm.returns.rma_approved.v1",
      allowedActors: ["human", "automation", "system"]
    },
    {
      id: "reject_rma",
      from: "OPEN",
      to: "RMA_REJECTED",
      triggeredBy: "dcm.returns.rma_rejected.v1",
      allowedActors: ["human", "automation", "system"]
    },
    {
      id: "await_receipt",
      from: "RMA_APPROVED",
      to: "RECEIPT_PENDING",
      triggeredBy: "dcm.returns.rma_approved.v1",
      allowedActors: ["human", "automation", "system"]
    },
    {
      id: "receive_return_external",
      from: "RMA_APPROVED",
      to: "RECEIVED",
      triggeredBy: "dcm.returns.return_received.v1",
      allowedActors: ["human", "automation", "webhook", "system"]
    },
    {
      id: "receive_return",
      from: "RECEIPT_PENDING",
      to: "RECEIVED",
      triggeredBy: "dcm.returns.return_received.v1",
      allowedActors: ["human", "automation", "webhook", "system"]
    },
    {
      id: "mark_damaged",
      from: "RECEIVED",
      to: "DAMAGED_HOLD",
      triggeredBy: "dcm.returns.return_received.v1",
      allowedActors: ["human", "automation", "system"],
      guards: [
        {
          id: "dcm.returns.guard.is_damaged_condition",
          description: "Returned item condition is damaged",
          failureMessage: "Return condition is not damaged",
          severity: "hard",
          evaluatedBy: "module"
        }
      ]
    },
    {
      id: "restock_return",
      from: "RECEIVED",
      to: "RESTOCKED",
      triggeredBy: "dcm.returns.return_restocked.v1",
      allowedActors: ["human", "automation", "system"]
    },
    {
      id: "restock_from_hold",
      from: "DAMAGED_HOLD",
      to: "RESTOCKED",
      triggeredBy: "scm.inventory.stock_returned.v1",
      allowedActors: ["human", "automation", "system"]
    },
    {
      id: "credit_return",
      from: "RESTOCKED",
      to: "CREDITED",
      triggeredBy: "dcm.returns.return_credited.v1",
      allowedActors: ["human", "automation", "system"]
    },
    {
      id: "close_return",
      from: "CREDITED",
      to: "CLOSED",
      triggeredBy: "dcm.returns.return_credited.v1",
      allowedActors: ["human", "automation", "ai-agent", "system"],
      guards: [
        {
          id: "dcm.returns.guard.is_finalized",
          description: "Return is fully finalized",
          failureMessage: "Return is not finalized",
          severity: "hard",
          evaluatedBy: "module"
        }
      ]
    }
  ],
  outcome: {
    id: "return_completed",
    description: "Return processed and customer credited",
    valueUnit: MeterUnits.RETURN_COMPLETED,
    measurable: true,
    businessMetrics: [
      {
        id: "return_cycle_time",
        label: "Return cycle time",
        unit: "days",
        improvableByAI: true
      },
      {
        id: "restock_rate",
        label: "Restockable return rate",
        unit: "percentage",
        improvableByAI: true
      }
    ]
  },
  participants: ["dcm.returns", "scm.inventory"]
};

export const returns = definition;
