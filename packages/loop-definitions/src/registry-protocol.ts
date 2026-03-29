// @license MIT
// Copyright (c) Better Data, Inc.
// SPDX-License-Identifier: MIT

import type { LoopDefinition } from "./types";
import type { LoopManifestEntry, LoopPackageManifest } from "./manifest";

export interface LoopRegistryQuery {
  domain?: string;
  tags?: string[];
  searchText?: string;
  installedOnly?: boolean;
  page?: number;
  limit?: number;
}

export interface LoopRegistryResult {
  loops: LoopManifestEntry[];
  total: number;
  page: number;
}

export interface LoopRegistryProtocol {
  search(query: LoopRegistryQuery): Promise<LoopRegistryResult>;
  getManifest(loopId: string): Promise<LoopPackageManifest | null>;
  getDefinition(loopId: string, version?: string): Promise<LoopDefinition | null>;
  install(loopId: string, orgId: string): Promise<{ success: boolean; error?: string }>;
}
