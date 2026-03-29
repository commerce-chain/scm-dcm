// @license MIT
// Copyright (c) Better Data, Inc.
// SPDX-License-Identifier: MIT

import { describe, expect, it } from "vitest";
import { scmLoops } from "../scm";

describe("Canonical SCM definitions", () => {
  it("have non-empty states", () => {
    scmLoops.forEach((definition) => {
      expect(definition.states.length).toBeGreaterThan(0);
    });
  });

  it("have at least one terminal state", () => {
    scmLoops.forEach((definition) => {
      expect(definition.terminalStates.length).toBeGreaterThan(0);
    });
  });

  it("have transitions referencing known states", () => {
    scmLoops.forEach((definition) => {
      definition.transitions.forEach((transition) => {
        expect(definition.states.includes(transition.from)).toBe(true);
        expect(definition.states.includes(transition.to)).toBe(true);
      });
    });
  });

  it("has non-empty outcome valueUnit", () => {
    scmLoops.forEach((definition) => {
      expect(definition.outcome.valueUnit.trim().length).toBeGreaterThan(0);
    });
  });
});
