// @license MIT
// Copyright (c) Better Data, Inc.
// SPDX-License-Identifier: MIT

import { describe, expect, it } from "vitest";
import { extractLearningSignal } from "../learning";
import type { LoopCompletedEvent, TransitionExecutedEvent } from "../types";

const completed: LoopCompletedEvent = {
  type: "loop.completed",
  eventId: "evt-completed",
  loopId: "scm.procurement",
  aggregateId: "PO-1",
  orgId: "org-1",
  occurredAt: new Date("2026-03-09T00:00:00.000Z").toISOString(),
  correlationId: "corr-1",
  schemaVersion: "1.0",
  terminalState: "CLOSED",
  actor: { actorId: "user:1", actorType: "human" },
  durationMs: 3 * 86_400_000,
  transitionCount: 4,
  outcomeId: "po_settled",
  valueUnit: "po_settled"
};

const transitions: TransitionExecutedEvent[] = [
  {
    type: "loop.transition.executed",
    eventId: "evt-1",
    loopId: "scm.procurement",
    aggregateId: "PO-1",
    orgId: "org-1",
    occurredAt: new Date("2026-03-09T00:00:00.000Z").toISOString(),
    correlationId: "corr-1",
    schemaVersion: "1.0",
    fromState: "OPEN",
    toState: "PO_CONFIRMED",
    transitionId: "confirm_po",
    actor: { actorId: "user:1", actorType: "human" },
    evidence: {}
  }
];

describe("extractLearningSignal", () => {
  it("filters predicted to declared BusinessMetric ids", () => {
    const definition = {
      outcome: {
        businessMetrics: [
          { id: "cycle_time_days", unit: "days" as const },
          { id: "stockout_prevented", unit: "boolean" as const }
        ]
      }
    };
    const signal = extractLearningSignal(completed, transitions, definition, {
      cycle_time_days: 5,
      arbitrary_key: "ignored"
    });
    expect(signal.predicted.cycle_time_days).toBe(5);
    expect("arbitrary_key" in signal.predicted).toBe(false);
  });

  it("computes cycle_time_days from completion duration", () => {
    const definition = {
      outcome: {
        businessMetrics: [{ id: "cycle_time_days", unit: "days" as const }]
      }
    };
    const signal = extractLearningSignal(completed, transitions, definition);
    expect(signal.actual.cycle_time_days as number).toBeCloseTo(3, 1);
  });

  it("computes numeric delta only for numeric metrics", () => {
    const definition = {
      outcome: {
        businessMetrics: [{ id: "cycle_time_days", unit: "days" as const }]
      }
    };
    const signal = extractLearningSignal(completed, transitions, definition, { cycle_time_days: 5 });
    expect(signal.delta.cycle_time_days).toBe(-2);
  });

  it("excludes non-derivable boolean metric from delta", () => {
    const definition = {
      outcome: {
        businessMetrics: [{ id: "stockout_prevented", unit: "boolean" as const }]
      }
    };
    const signal = extractLearningSignal(completed, transitions, definition, { stockout_prevented: true });
    expect(signal.delta.stockout_prevented).toBeUndefined();
  });
});
