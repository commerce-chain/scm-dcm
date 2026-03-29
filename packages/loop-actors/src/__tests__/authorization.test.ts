// @license MIT
// Copyright (c) Better Data, Inc.
// SPDX-License-Identifier: MIT

import { describe, expect, it } from "vitest";
import { canActorExecuteTransition } from "../authorization";

const procurement = {
  id: "scm.procurement",
  version: "0.1.0",
  description: "procurement",
  domain: "scm",
  states: ["OPEN", "PO_CONFIRMED", "CLOSED"],
  initialState: "OPEN",
  terminalStates: ["CLOSED"],
  errorStates: [],
  transitions: [
    {
      id: "confirm_po",
      from: "OPEN",
      to: "PO_CONFIRMED",
      triggeredBy: "scm.procurement.po_confirmed.v1",
      allowedActors: ["human"]
    },
    {
      id: "close_procurement",
      from: "PO_CONFIRMED",
      to: "CLOSED",
      triggeredBy: "scm.procurement.closed.v1",
      allowedActors: ["human", "ai-agent", "webhook"]
    }
  ],
  outcome: {
    id: "po_settled",
    description: "done",
    valueUnit: "po_settled",
    measurable: true,
    businessMetrics: [{ id: "x", label: "x", unit: "units", improvableByAI: true }]
  }
};

describe("canActorExecuteTransition", () => {
  it("authorizes human actor", () => {
    const result = canActorExecuteTransition(
      { type: "human", actorId: "u1", sessionId: "s1", orgId: "o1" },
      "confirm_po",
      procurement
    );
    expect(result.authorized).toBe(true);
  });

  it("authorizes ai actor when allowed", () => {
    const result = canActorExecuteTransition(
      { type: "ai-agent", actorId: "agent:1", agentId: "gpt", gatewaySessionId: "gs", orgId: "o1" },
      "close_procurement",
      procurement
    );
    expect(result.authorized).toBe(true);
  });

  it("rejects ai actor for human-only transition", () => {
    const result = canActorExecuteTransition(
      { type: "ai-agent", actorId: "agent:1", agentId: "gpt", gatewaySessionId: "gs", orgId: "o1" },
      "confirm_po",
      procurement
    );
    expect(result.authorized).toBe(false);
  });

  it("rejects system actor for human-only transition", () => {
    const loop = structuredClone(procurement);
    loop.transitions[0]!.allowedActors = ["human"];
    const result = canActorExecuteTransition({ type: "system", actorId: "system:x", orgId: "o1" }, "confirm_po", loop);
    expect(result.authorized).toBe(false);
  });

  it("authorizes webhook when allowed", () => {
    const result = canActorExecuteTransition(
      { type: "webhook", actorId: "webhook:shopify", source: "shopify", orgId: "o1" },
      "close_procurement",
      procurement
    );
    expect(result.authorized).toBe(true);
  });
});
