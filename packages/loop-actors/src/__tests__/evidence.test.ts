// @license MIT
// Copyright (c) Better Data, Inc.
// SPDX-License-Identifier: MIT

import { describe, expect, it } from "vitest";
import { buildAIActorEvidence } from "../ai-actor";
import { buildTransitionEvidence } from "../evidence";

describe("evidence", () => {
  it("merges domain evidence and actor fields", () => {
    const evidence = buildTransitionEvidence(
      { type: "human", actorId: "u1", sessionId: "s1", orgId: "o1" },
      "confirm_po",
      { approved: true }
    );
    expect(evidence.approved).toBe(true);
    expect(evidence.actor_type).toBe("human");
    expect(evidence.actor_id).toBe("u1");
  });

  it("includes ai confidence and reasoning", () => {
    const evidence = buildAIActorEvidence({
      actor: { type: "ai-agent", actorId: "agent:x", agentId: "claude", gatewaySessionId: "gs1", orgId: "o1" },
      loopId: "scm.procurement",
      aggregateId: "PO-1",
      recommendedTransition: "close_procurement",
      confidence: 0.92,
      reasoning: "All checks pass",
      evidence: {}
    });
    expect(evidence.ai_confidence).toBe(0.92);
    expect(evidence.ai_reasoning).toBe("All checks pass");
  });

  it("human evidence excludes ai fields", () => {
    const evidence = buildTransitionEvidence(
      { type: "human", actorId: "u1", sessionId: "s1", orgId: "o1" },
      "confirm_po",
      {}
    );
    expect(evidence.ai_agent_id).toBeUndefined();
  });
});
