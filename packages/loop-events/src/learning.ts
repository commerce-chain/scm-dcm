// @license MIT
// Copyright (c) Better Data, Inc.
// SPDX-License-Identifier: MIT

import type { LoopCompletedEvent, TransitionExecutedEvent } from "./types";

type BusinessMetricUnit = "boolean" | "days" | "units" | "currency" | "percentage";
type LoopDefinitionLike = {
  outcome: {
    businessMetrics: Array<{ id: string; unit: BusinessMetricUnit }>;
  };
};

export interface LearningSignal {
  loopId: string;
  aggregateId: string;
  outcomeId: string;
  businessMetricIds: string[];
  predicted: Record<string, unknown>;
  actual: Record<string, unknown>;
  delta: Record<string, unknown>;
  occurredAt: string;
}

function computeDelta(
  predicted: Record<string, unknown>,
  actual: Record<string, unknown>,
  metricUnitsById: Record<string, BusinessMetricUnit>
): Record<string, unknown> {
  const keys = new Set(Object.keys(predicted).filter((key) => key in actual));
  const delta: Record<string, unknown> = {};
  for (const key of keys) {
    const pred = predicted[key];
    const act = actual[key];
    const unit = metricUnitsById[key];
    if ((unit === "days" || unit === "units" || unit === "currency" || unit === "percentage") && typeof pred === "number" && typeof act === "number") {
      delta[key] = act - pred;
    }
  }
  return delta;
}

export function extractLearningSignal(
  completed: LoopCompletedEvent,
  transitions: TransitionExecutedEvent[],
  definition: LoopDefinitionLike,
  predicted?: Record<string, unknown>
): LearningSignal {
  const metrics = definition.outcome.businessMetrics;
  const metricIds = metrics.map((metric) => metric.id);
  const metricUnitsById = Object.fromEntries(metrics.map((metric) => [metric.id, metric.unit])) as Record<
    string,
    BusinessMetricUnit
  >;

  const predictedSafe = Object.fromEntries(
    Object.entries(predicted ?? {}).filter(([key]) => {
      const valid = metricIds.includes(key);
      if (!valid) {
        console.warn(`[loop-events] Ignoring predicted metric not in definition: ${key}`);
      }
      return valid;
    })
  );

  const actual: Record<string, unknown> = {};
  for (const metric of metrics) {
    if (metric.id === "cycle_time_days" || metric.id.endsWith("_cycle_time")) {
      actual[metric.id] = completed.durationMs / 86_400_000;
      continue;
    }
    if (metric.id === "transition_count") {
      actual[metric.id] = completed.transitionCount;
      continue;
    }
    for (const transition of transitions) {
      if (metric.id in transition.evidence) {
        actual[metric.id] = transition.evidence[metric.id];
      }
    }
  }

  return {
    loopId: completed.loopId,
    aggregateId: completed.aggregateId,
    outcomeId: completed.outcomeId,
    businessMetricIds: metricIds,
    predicted: predictedSafe,
    actual,
    delta: predicted ? computeDelta(predictedSafe, actual, metricUnitsById) : {},
    occurredAt: completed.occurredAt
  };
}
