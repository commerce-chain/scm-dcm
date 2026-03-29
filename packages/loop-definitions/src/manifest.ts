// @license MIT
// Copyright (c) Better Data, Inc.
// SPDX-License-Identifier: MIT

import { z } from "zod";

export interface LoopManifestEntry {
  id: string;
  version: string;
  domain: string;
  description: string;
  participants?: string[];
  tags: string[];
}

export interface LoopPackageManifest {
  name: string;
  version: string;
  license: string;
  description: string;
  author: string;
  loops: LoopManifestEntry[];
  dependencies?: string[];
}

export const LoopManifestEntrySchema = z.object({
  id: z.string().min(1),
  version: z.string().min(1),
  domain: z.string().min(1),
  description: z.string().min(1),
  participants: z.array(z.string().min(1)).optional(),
  tags: z.array(z.string().min(1)).min(1)
});

export const LoopPackageManifestSchema = z.object({
  name: z.string().min(1),
  version: z.string().min(1),
  license: z.string().min(1),
  description: z.string().min(1),
  author: z.string().min(1),
  loops: z.array(LoopManifestEntrySchema).min(1),
  dependencies: z.array(z.string().min(1)).optional()
});
