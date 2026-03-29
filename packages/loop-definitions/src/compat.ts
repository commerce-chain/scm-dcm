// @license MIT
// Copyright (c) Better Data, Inc.
// SPDX-License-Identifier: MIT

import { dcmLoops } from "./dcm";
import { scmLoops } from "./scm";
import type { LoopDefinition, RuntimeLoopDefinition } from "./types";

export type SerializedLoopTransition = {
  from: string;
  to: string;
  on: string;
  externalActorAllowed?: boolean;
  guard?: string;
  sideEffect?: string;
};

export type SerializedLoopDefinition = RuntimeLoopDefinition;

export type PublishedLoopDefinition = {
  scope: "@betterdata";
  name: string;
  version: string;
  description: string;
  loopId: string;
  industry: "scm" | "dcm";
  publishedBy: string;
  publishedAt: string;
  license: "MIT";
  definition: SerializedLoopDefinition;
};

const PUBLISHED_AT = "2026-03-09T00:00:00.000Z";
const PUBLISHED_BY = "betterdata-platform";

export function toRuntimeLoopDefinition(definition: LoopDefinition): RuntimeLoopDefinition {
  return {
    loopId: definition.id,
    version: definition.version,
    initialState: definition.initialState,
    terminalStates: definition.terminalStates,
    exceptionStates: definition.errorStates,
    transitions: definition.transitions.map((transition) => ({
      from: transition.from,
      to: transition.to,
      on: transition.triggeredBy,
      externalActorAllowed: transition.allowedActors.includes("webhook"),
      guard: transition.guards?.[0]?.id,
      guards: transition.guards?.map((guard) => ({
        id: guard.id,
        severity: guard.severity,
        evaluatedBy: guard.evaluatedBy,
        failureMessage: guard.failureMessage
      }))
    }))
  };
}

const ALL = [...scmLoops, ...dcmLoops];

export const LOOP_DEFINITIONS: PublishedLoopDefinition[] = ALL.map((definition) => ({
  scope: "@betterdata",
  name: definition.id.replace(".", "-"),
  version: "1.0.0",
  description: definition.description,
  loopId: definition.id,
  industry: definition.domain === "scm" ? "scm" : "dcm",
  publishedBy: PUBLISHED_BY,
  publishedAt: PUBLISHED_AT,
  license: "MIT",
  definition: toRuntimeLoopDefinition(definition)
}));

export function getLoopDefinition(scope: string, name: string, version: string): PublishedLoopDefinition | undefined {
  return LOOP_DEFINITIONS.find((entry) => entry.scope === scope && entry.name === name && entry.version === version);
}
