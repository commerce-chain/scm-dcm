// @license MIT
// Copyright (c) Better Data, Inc.
// SPDX-License-Identifier: MIT

export type ActorRole = "human" | "automation" | "ai-agent" | "webhook" | "system";

export type BusinessMetricUnit = "boolean" | "days" | "units" | "currency" | "percentage";

export interface BusinessMetric {
  id: string;
  label: string;
  unit: BusinessMetricUnit;
  improvableByAI: boolean;
}

export interface GuardDefinition {
  id: string;
  description: string;
  failureMessage: string;
  severity: "hard" | "soft";
  evaluatedBy: "runtime" | "module" | "external";
}

export interface OutcomeSpec {
  id: string;
  description: string;
  valueUnit: string;
  measurable: boolean;
  businessMetrics: BusinessMetric[];
}

export interface SideEffectSpec {
  id: string;
  description: string;
  triggeredBy: string;
}

export interface LoopTransitionSpec {
  id: string;
  from: string;
  to: string;
  allowedActors: ActorRole[];
  triggeredBy: string;
  guards?: GuardDefinition[];
  sideEffects?: SideEffectSpec[];
  description?: string;
}

export interface LoopDefinition {
  id: string;
  version: string;
  description: string;
  domain: string;
  states: string[];
  initialState: string;
  terminalStates: string[];
  errorStates: string[];
  transitions: LoopTransitionSpec[];
  outcome: OutcomeSpec;
  participants?: string[];
  spawnableLoops?: string[];
  metadata?: Record<string, unknown>;
}

// Internal runtime adapter shape used by proprietary runtime.
export interface RuntimeLoopTransition {
  from: string;
  to: string;
  on: string;
  externalActorAllowed?: boolean;
  guard?: string;
  guards?: Array<{
    id: string;
    severity: "hard" | "soft";
    evaluatedBy: "runtime" | "module" | "external";
    failureMessage: string;
  }>;
}

export interface RuntimeLoopDefinition {
  loopId: string;
  version: string;
  initialState: string;
  terminalStates: string[];
  exceptionStates: string[];
  transitions: RuntimeLoopTransition[];
}
