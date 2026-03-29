// Copyright (c) Better Data, Inc.
// SPDX-License-Identifier: Apache-2.0

import type { LoopParticipantManifest } from "@betterdata/loop-definitions";

export type CatalogLoopParticipant = LoopParticipantManifest;

export const catalogLoopParticipant: LoopParticipantManifest = {
  moduleId: "scm.catalog",
  description: "Product catalog — loop hooks reserved for future catalog-driven transitions",
  handles: []
};
