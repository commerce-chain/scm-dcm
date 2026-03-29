// @license MIT
// Copyright (c) Better Data, Inc.
// SPDX-License-Identifier: MIT

import { describe, expect, it } from "vitest";
import { LoopPackageManifestSchema, WellKnownLoops, scmLoops } from "../index";

describe("Manifest + well known loops", () => {
  it("validates valid manifest", () => {
    const result = LoopPackageManifestSchema.safeParse({
      name: "@acme/crm-loops",
      version: "1.0.0",
      license: "MIT",
      description: "CRM loops",
      author: "ACME",
      loops: [
        {
          id: "crm.lead_conversion",
          version: "1.0.0",
          domain: "crm",
          description: "Lead conversion",
          tags: ["crm", "sales"]
        }
      ]
    });
    expect(result.success).toBe(true);
  });

  it("rejects manifest with no loops", () => {
    const result = LoopPackageManifestSchema.safeParse({
      name: "@acme/crm-loops",
      version: "1.0.0",
      license: "MIT",
      description: "CRM loops",
      author: "ACME",
      loops: []
    });
    expect(result.success).toBe(false);
  });

  it("requires non-empty tags", () => {
    const result = LoopPackageManifestSchema.safeParse({
      name: "@acme/crm-loops",
      version: "1.0.0",
      license: "MIT",
      description: "CRM loops",
      author: "ACME",
      loops: [{ id: "x", version: "1", domain: "crm", description: "d", tags: [] }]
    });
    expect(result.success).toBe(false);
  });

  it("well known loops map to canonical IDs", () => {
    const ids = scmLoops.map((loop) => loop.id);
    expect(ids.includes(WellKnownLoops.SCM_PROCUREMENT)).toBe(true);
    expect(ids.includes(WellKnownLoops.SCM_FULFILLMENT)).toBe(true);
    expect(ids.includes(WellKnownLoops.SCM_QUALITY)).toBe(true);
    expect(ids.includes(WellKnownLoops.SCM_REPLENISHMENT)).toBe(true);
    expect(ids.includes(WellKnownLoops.SCM_INVENTORY)).toBe(true);
  });
});
