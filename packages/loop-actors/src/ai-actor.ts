// @license MIT
// Copyright (c) Better Data, Inc.
// SPDX-License-Identifier: MIT

import type { LoopDefinition } from "@betterdata/loop-definitions";
import type { Evidence } from "@betterdata/loop-events";
import type { AIAgentActor } from "./types";

export interface AIActorConstraints {
  canRecommendTransitions: true;
  canExecuteTransitions: boolean;
  requiresHumanApprovalFor: string[];
  maxConsecutiveAITransitions: number;
}

export interface AIActorSubmission {
  actor: AIAgentActor;
  loopId: string;
  aggregateId: string;
  recommendedTransition: string;
  confidence: number;
  reasoning: string;
  evidence: Evidence;
}

export interface AIActorResult {
  status: "executed" | "pending_approval" | "guard_failed" | "rejected";
  transitionId: string;
  requiresApprovalFrom?: string;
  guardFailureMessage?: string;
}

export function isAIActorAllowed(
  _actor: AIAgentActor,
  transitionId: string,
  definition: LoopDefinition,
  constraints: AIActorConstraints
): { allowed: boolean; reason?: string } {
  const transition = definition.transitions.find((entry) => entry.id === transitionId);
  if (!transition) return { allowed: false, reason: "invalid_transition" };
  if (!constraints.canExecuteTransitions) return { allowed: false, reason: "human_approval_required" };
  if (constraints.requiresHumanApprovalFor.includes(transitionId)) {
    return { allowed: false, reason: "human_approval_required" };
  }
  if (!transition.allowedActors.includes("ai-agent")) {
    return { allowed: false, reason: "unauthorized_actor" };
  }
  return { allowed: true };
}

export function buildAIActorEvidence(
  submission: AIActorSubmission,
  existingEvidence: Evidence = {}
): Evidence {
  return {
    ...existingEvidence,
    ...submission.evidence,
    ai_actor_id: submission.actor.actorId,
    ai_agent_id: submission.actor.agentId,
    ai_confidence: submission.confidence,
    ai_reasoning: submission.reasoning,
    ai_recommended_transition: submission.recommendedTransition
  };
}
