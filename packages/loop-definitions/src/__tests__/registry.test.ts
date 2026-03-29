// @license MIT
// Copyright (c) Better Data, Inc.
// SPDX-License-Identifier: MIT

import { describe, expect, it } from "vitest";
import { LoopRegistry, procurement } from "../index";

describe("LoopRegistry", () => {
  it("register adds definition", () => {
    const registry = new LoopRegistry();
    registry.register(procurement);
    expect(registry.get(procurement.id)?.id).toBe(procurement.id);
  });

  it("get returns by id", () => {
    const registry = LoopRegistry.createWithBuiltins();
    expect(registry.get("scm.procurement")?.id).toBe("scm.procurement");
  });

  it('list("scm") returns scm loops only', () => {
    const registry = LoopRegistry.createWithBuiltins();
    const scm = registry.list("scm");
    expect(scm.length).toBeGreaterThan(0);
    expect(scm.every((definition) => definition.domain === "scm")).toBe(true);
  });

  it("validate passes for valid definition", () => {
    const registry = new LoopRegistry();
    expect(registry.validate(procurement).valid).toBe(true);
  });

  it("validate returns errors for invalid shape", () => {
    const registry = new LoopRegistry();
    const result = registry.validate({ id: "x" });
    expect(result.valid).toBe(false);
    expect(result.errors.length).toBeGreaterThan(0);
  });

  it("duplicate id throws", () => {
    const registry = new LoopRegistry();
    registry.register(procurement);
    expect(() => registry.register(procurement)).toThrow(/already registered/);
  });
});
