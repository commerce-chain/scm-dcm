// Copyright (c) Better Data, Inc. and contributors
// SPDX-License-Identifier: Apache-2.0

import { catalogLoopParticipant } from "@betterdata/scm-catalog";
import { demandLoopParticipant } from "@betterdata/dcm-demand";
import { orderLoopParticipant } from "@betterdata/dcm-orders";
import { returnsLoopParticipant } from "@betterdata/dcm-returns";
import { EventNames, LoopIds } from "@betterdata/loop-definitions";
import { executionLoopParticipant } from "@betterdata/scm-execution";
import { inventoryLoopParticipant } from "@betterdata/scm-inventory";
import { procurementLoopParticipant } from "@betterdata/scm-procurement";
import { describe, expect, test } from "vitest";

const ALL_LOOP_IDS = new Set<string>(Object.values(LoopIds));
const ALL_EVENT_NAMES = new Set<string>(Object.values(EventNames));

const ALL_PARTICIPANTS = [
  inventoryLoopParticipant,
  procurementLoopParticipant,
  executionLoopParticipant,
  catalogLoopParticipant,
  demandLoopParticipant,
  orderLoopParticipant,
  returnsLoopParticipant
];

describe("Loop participant validation", () => {
  test("all participants have a moduleId", () => {
    for (const p of ALL_PARTICIPANTS) {
      expect(p.moduleId, "participant missing moduleId").toBeTruthy();
    }
  });

  test("all participant loop references are in LoopIds", () => {
    for (const participant of ALL_PARTICIPANTS) {
      for (const handler of participant.handles) {
        for (const loopId of handler.loops) {
          expect(
            ALL_LOOP_IDS.has(loopId),
            `${participant.moduleId} references unknown loop: "${loopId}". Add to LoopIds in loop-definitions.`
          ).toBe(true);
        }
      }
    }
  });

  test("all participant event references are in EventNames", () => {
    for (const participant of ALL_PARTICIPANTS) {
      for (const handler of participant.handles) {
        if (typeof handler.event === "string" && handler.event.startsWith("TODO:")) continue;
        expect(
          ALL_EVENT_NAMES.has(handler.event),
          `${participant.moduleId} references unknown event: "${handler.event}". Add to EventNames in loop-definitions.`
        ).toBe(true);
      }
    }
  });
});
