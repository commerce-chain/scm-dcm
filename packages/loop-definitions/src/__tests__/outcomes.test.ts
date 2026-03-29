// @license MIT
// Copyright (c) Better Data, Inc.
// SPDX-License-Identifier: MIT

import { describe, expect, it } from "vitest";
import { scmLoops } from "../scm";

describe("Outcome alignment", () => {
  it("each SCM loop has business metrics", () => {
    scmLoops.forEach((definition) => {
      expect(definition.outcome.businessMetrics.length).toBeGreaterThan(0);
    });
  });

  it("improvable metrics define unit", () => {
    scmLoops.forEach((definition) => {
      definition.outcome.businessMetrics
        .filter((metric) => metric.improvableByAI)
        .forEach((metric) => {
          expect(metric.unit).toBeTruthy();
        });
    });
  });

  it("outcome id roughly aligns to valueUnit", () => {
    scmLoops.forEach((definition) => {
      expect(definition.outcome.valueUnit.includes("_")).toBe(true);
      expect(definition.outcome.id.includes("_")).toBe(true);
    });
  });
});
