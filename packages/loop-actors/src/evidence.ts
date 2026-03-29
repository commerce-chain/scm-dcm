// @license MIT
// Copyright (c) Better Data, Inc.
// SPDX-License-Identifier: MIT

import type { Evidence } from "@betterdata/loop-events";
import type { AIAgentActor, Actor } from "./types";

type EvidenceOptions = { includeTimestamp?: boolean; includeActorDetail?: boolean };

export function buildTransitionEvidence(
  actor: Actor,
  transitionId: string,
  domainEvidence: Evidence,
  options: EvidenceOptions = {}
): Evidence {
  const base: Evidence = {
    ...domainEvidence,
    actor_type: actor.type,
    actor_id: actor.actorId,
    transition_id: transitionId
  };
  if (actor.type === "ai-agent") {
    const ai = actor as AIAgentActor;
    base.ai_agent_id = ai.agentId;
  }
  if (options.includeActorDetail) {
    base.actor = actor;
  }
  if (options.includeTimestamp) {
    base.executed_at = new Date().toISOString();
  }
  return base;
}
