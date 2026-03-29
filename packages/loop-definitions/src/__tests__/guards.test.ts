// @license MIT
// Copyright (c) Better Data, Inc.
// SPDX-License-Identifier: MIT

import { describe, expect, it } from "vitest";
import { LoopRegistry, procurement } from "../index";

describe("Guards", () => {
  it("returns guards for OPEN->PO_CONFIRMED", () => {
    const registry = LoopRegistry.createWithBuiltins();
    const guards = registry.getGuardsForTransition("scm.procurement", "confirm_po");
    expect(guards.length).toBeGreaterThan(0);
  });

  it("filters hard guards only", () => {
    const registry = LoopRegistry.createWithBuiltins();
    const guards = registry.getHardGuardsForTransition("scm.procurement", "confirm_po");
    expect(guards.every((guard) => guard.severity === "hard")).toBe(true);
  });

  it("allows unknown guard id", () => {
    const loop = structuredClone(procurement);
    loop.transitions[0]!.guards = [
      {
        id: "custom_guard",
        description: "Custom",
        failureMessage: "Custom failure",
        severity: "soft",
        evaluatedBy: "external"
      }
    ];
    const registry = new LoopRegistry();
    expect(() => registry.register(loop)).not.toThrow();
  });

  it("allows transition with no guards", () => {
    const loop = structuredClone(procurement);
    loop.transitions[0]!.guards = undefined;
    const registry = new LoopRegistry();
    expect(() => registry.register(loop)).not.toThrow();
  });
});
