// Copyright (c) Better Data, Inc. and contributors
// SPDX-License-Identifier: Apache-2.0

import type { EventName } from "./event-names";
import type { LoopId } from "./loop-ids";

/**
 * Canonical shape for loop participant manifests.
 * Every domain module's *LoopParticipant must conform to this type.
 */
export interface LoopParticipantManifest {
  /** Module identifier — dotted form (e.g. scm.inventory, dcm.orders). */
  moduleId: string;

  /** Human-readable description of this module's role in the loop graph. */
  description?: string;

  handles: LoopParticipantHandler[];
}

export interface LoopParticipantHandler {
  /** The event type this handler responds to. */
  event: EventName | string;

  /** Which loops this handler participates in. */
  loops: readonly LoopId[];

  /** Human-readable description of what this handler does. */
  description?: string;
}
