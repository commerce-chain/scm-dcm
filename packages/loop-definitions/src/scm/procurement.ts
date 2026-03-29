// @license MIT
// Copyright (c) Better Data, Inc.
// SPDX-License-Identifier: MIT

import type { LoopDefinition } from "../types";
import { MeterUnits } from "../meter-units";

export const definition: LoopDefinition = {
  id: "scm.procurement",
  version: "0.1.0",
  description: "Procurement orchestration loop for PO confirmation, receipt, and invoice matching.",
  domain: "scm",
  states: ["OPEN", "PO_CONFIRMED", "RECEIPT_SCHEDULED", "GOODS_RECEIVED", "INVOICE_MATCHED", "DISPUTED", "CLOSED"],
  initialState: "OPEN",
  terminalStates: ["CLOSED"],
  errorStates: ["DISPUTED"],
  transitions: [
    {
      id: "confirm_po",
      from: "OPEN",
      to: "PO_CONFIRMED",
      triggeredBy: "scm.procurement.po_confirmed.v1",
      allowedActors: ["human", "automation", "system"],
      guards: [
        {
          id: "budget_available",
          description: "PO amount is within approved budget",
          failureMessage: "Budget unavailable for this purchase order",
          severity: "hard",
          evaluatedBy: "module"
        },
        {
          id: "supplier_approved",
          description: "Supplier is approved by policy",
          failureMessage: "Supplier is not approved",
          severity: "hard",
          evaluatedBy: "module"
        },
        {
          id: "quantity_within_threshold",
          description: "Ordered quantity is within configured threshold",
          failureMessage: "Ordered quantity exceeds configured threshold",
          severity: "soft",
          evaluatedBy: "module"
        }
      ]
    },
    {
      id: "schedule_receipt",
      from: "PO_CONFIRMED",
      to: "RECEIPT_SCHEDULED",
      triggeredBy: "scm.execution.receipt_scheduled.v1",
      allowedActors: ["human", "automation", "webhook", "system"]
    },
    {
      id: "receive_goods",
      from: "RECEIPT_SCHEDULED",
      to: "GOODS_RECEIVED",
      triggeredBy: "scm.execution.goods_received.v1",
      allowedActors: ["human", "automation", "webhook", "system"],
      guards: [
        {
          id: "three_way_match",
          description: "PO, receipt and invoice quantities are aligned",
          failureMessage: "Three-way match failed",
          severity: "hard",
          evaluatedBy: "module"
        }
      ]
    },
    {
      id: "trigger_invoice_match",
      from: "GOODS_RECEIVED",
      to: "INVOICE_MATCHED",
      triggeredBy: "scm.procurement.invoice_match_triggered.v1",
      allowedActors: ["human", "automation", "system"]
    },
    {
      id: "mark_disputed",
      from: "INVOICE_MATCHED",
      to: "DISPUTED",
      triggeredBy: "scm.procurement.invoice_match_triggered.v1",
      allowedActors: ["human", "automation", "system"],
      guards: [
        {
          id: "scm.procurement.guard.has_mismatch",
          description: "Invoice mismatch was detected",
          failureMessage: "No mismatch was detected",
          severity: "hard",
          evaluatedBy: "module"
        }
      ]
    },
    {
      id: "close_procurement",
      from: "INVOICE_MATCHED",
      to: "CLOSED",
      triggeredBy: "scm.procurement.invoice_match_triggered.v1",
      allowedActors: ["human", "automation", "ai-agent", "system"],
      guards: [
        {
          id: "scm.procurement.guard.no_mismatch",
          description: "Invoice has no mismatch",
          failureMessage: "Invoice mismatch prevents close",
          severity: "hard",
          evaluatedBy: "module"
        }
      ]
    }
  ],
  outcome: {
    id: "po_settled",
    description: "Purchase order fully settled with matched invoice and inventory updated",
    valueUnit: MeterUnits.PO_SETTLED,
    measurable: true,
    businessMetrics: [
      {
        id: "lead_time_accuracy",
        label: "Supplier lead time accuracy",
        unit: "days",
        improvableByAI: true
      },
      {
        id: "three_way_match_rate",
        label: "3-way match on first attempt",
        unit: "boolean",
        improvableByAI: false
      },
      {
        id: "po_cycle_time",
        label: "PO cycle time",
        unit: "days",
        improvableByAI: true
      }
    ]
  },
  participants: ["scm.procurement", "scm.execution"]
};

export const procurement = definition;
