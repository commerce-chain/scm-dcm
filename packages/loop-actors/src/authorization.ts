// @license MIT
// Copyright (c) Better Data, Inc.
// SPDX-License-Identifier: MIT

import type { LoopDefinition } from "@betterdata/loop-definitions";
import type { AIActorConstraints } from "./ai-actor";
import type { Actor } from "./types";

export function canActorExecuteTransition(
  actor: Actor,
  transitionId: string,
  definition: LoopDefinition,
  constraints?: AIActorConstraints,
  currentConsecutiveAITransitions = 0
): { authorized: boolean; reason?: string } {
  const transition = definition.transitions.find((entry) => entry.id === transitionId);
  if (!transition) return { authorized: false, reason: "invalid_transition" };
  if (!transition.allowedActors.includes(actor.type)) {
    return {
      authorized: false,
      reason: actor.type === "ai-agent" ? "human_approval_required" : "unauthorized_actor"
    };
  }
  if (actor.type === "ai-agent" && constraints) {
    if (constraints.requiresHumanApprovalFor.includes(transitionId)) {
      return { authorized: false, reason: "human_approval_required" };
    }
    if (currentConsecutiveAITransitions >= constraints.maxConsecutiveAITransitions) {
      return { authorized: false, reason: "ai_circuit_breaker" };
    }
  }
  return { authorized: true };
}
