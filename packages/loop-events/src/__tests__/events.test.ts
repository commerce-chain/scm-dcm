// @license MIT
// Copyright (c) Better Data, Inc.
// SPDX-License-Identifier: MIT

import { describe, expect, it } from "vitest";
import { LoopEventSchema, extractLearningSignal } from "../index";
import type { LoopCompletedEvent, TransitionExecutedEvent } from "../types";

describe("loop-events schema", () => {
  const base = {
    eventId: "evt_1",
    loopId: "scm.procurement",
    aggregateId: "PO-1",
    orgId: "org_1",
    occurredAt: new Date().toISOString(),
    correlationId: "corr_1",
    schemaVersion: "1.0" as const
  };

  it("parses all event types", () => {
    const samples = [
      { ...base, type: "loop.started", initialState: "OPEN", actor: { actorId: "u1", actorType: "human" } },
      {
        ...base,
        type: "loop.transition.requested",
        fromState: "OPEN",
        transitionId: "close",
        actor: { actorId: "u1", actorType: "human" },
        evidence: {}
      },
      {
        ...base,
        type: "loop.transition.executed",
        fromState: "OPEN",
        toState: "CLOSED",
        transitionId: "close",
        actor: { actorId: "u1", actorType: "human" },
        evidence: {}
      },
      {
        ...base,
        type: "loop.transition.blocked",
        fromState: "OPEN",
        transitionId: "close",
        reason: "guard_failed",
        actor: { actorId: "u1", actorType: "human" },
        guardFailures: [{ guardId: "budget_available", message: "No budget" }]
      },
      {
        ...base,
        type: "loop.guard.failed",
        fromState: "OPEN",
        attemptedTransitionId: "close",
        guardId: "budget_available",
        guardFailureMessage: "No budget",
        actor: { actorId: "u1", actorType: "human" }
      },
      {
        ...base,
        type: "loop.transition.rejected",
        fromState: "OPEN",
        attemptedTransition: "close",
        reason: "guard_failed",
        actor: { actorId: "u1", actorType: "human" }
      },
      {
        ...base,
        type: "loop.completed",
        terminalState: "CLOSED",
        actor: { actorId: "u1", actorType: "human" },
        durationMs: 10,
        transitionCount: 3,
        outcomeId: "x",
        valueUnit: "x"
      },
      {
        ...base,
        type: "loop.error",
        errorState: "FAILED",
        errorCode: "E1",
        errorMessage: "boom",
        actor: { actorId: "u1", actorType: "human" }
      },
      { ...base, type: "loop.spawned", parentAggregateId: "PO-1", childLoopId: "dcm.order", childAggregateId: "SO-1" },
      { ...base, type: "loop.signal.received", signalType: "DEMAND_SPIKE", confidence: 0.91 }
    ];
    samples.forEach((sample) => {
      expect(LoopEventSchema.safeParse(sample).success).toBe(true);
    });
  });

  it("fails for unknown type", () => {
    expect(LoopEventSchema.safeParse({ ...base, type: "unknown.type" }).success).toBe(false);
  });

  it("preserves correlationId in chained events", () => {
    const e1 = { ...base, type: "loop.started", initialState: "OPEN", actor: { actorId: "u1", actorType: "human" } };
    const e2 = { ...base, type: "loop.signal.received", signalType: "X", confidence: 0.7 };
    expect(e1.correlationId).toBe(e2.correlationId);
  });

  it("computes numeric delta", () => {
    const completed = {
      ...base,
      type: "loop.completed",
      terminalState: "CLOSED",
      actor: { actorId: "u1", actorType: "human" },
      durationMs: 120,
      transitionCount: 3,
      outcomeId: "po_settled",
      valueUnit: "po_settled"
    } satisfies LoopCompletedEvent;
    const transitions = [
      {
        ...base,
        type: "loop.transition.executed",
        fromState: "OPEN",
        toState: "PO_CONFIRMED",
        transitionId: "confirm_po",
        actor: { actorId: "u1", actorType: "human" },
        evidence: { lead_time_accuracy: 2 }
      }
    ] satisfies TransitionExecutedEvent[];
    const definition = {
      outcome: {
        businessMetrics: [{ id: "lead_time_accuracy", unit: "days" as const }]
      }
    };
    const signal = extractLearningSignal(completed, transitions, definition, { lead_time_accuracy: 5 });
    expect(signal.delta.lead_time_accuracy).toBe(-3);
  });

  it("returns empty delta without predicted", () => {
    const completed = {
      ...base,
      type: "loop.completed",
      terminalState: "CLOSED",
      actor: { actorId: "u1", actorType: "human" },
      durationMs: 120,
      transitionCount: 3,
      outcomeId: "po_settled",
      valueUnit: "po_settled"
    } satisfies LoopCompletedEvent;
    const definition = {
      outcome: {
        businessMetrics: [{ id: "lead_time_accuracy", unit: "days" as const }]
      }
    };
    const signal = extractLearningSignal(completed, [], definition);
    expect(Object.keys(signal.delta)).toHaveLength(0);
  });
});
