// Copyright (c) Better Data, Inc.
// SPDX-License-Identifier: Apache-2.0

export type CatalogLoopParticipant = {
  module: "scm-catalog";
  handles: Array<{
    event: string;
    loops: string[];
  }>;
};

export const catalogLoopParticipant: CatalogLoopParticipant = {
  module: "scm-catalog",
  handles: []
};
