// Copyright (c) Better Data, Inc.
// SPDX-License-Identifier: Apache-2.0

import type { ChannelReader, OutboxWriter } from "@betterdata/scm-contracts";
import { createModuleRuntimeStore } from "@betterdata/scm-contracts";

export interface InventoryRuntimeConfig {
  /** Returns the root DB client (e.g. PrismaClient). */
  getDb: () => unknown;
  outbox: OutboxWriter;
  readChannelMessages: ChannelReader;
}

const inventoryRuntime = createModuleRuntimeStore<InventoryRuntimeConfig>(
  "@betterdata/scm-inventory",
  "configureInventoryRuntime({ getDb, outbox, readChannelMessages })"
);

/**
 * Wire infrastructure once at app startup (e.g. from your Next.js `lib/prisma` module).
 * Required before using StockService / reservation helpers that emit outbox events.
 */
export function configureInventoryRuntime(config: InventoryRuntimeConfig): void {
  inventoryRuntime.configure(config);
}

export function getInventoryRuntime(): InventoryRuntimeConfig {
  return inventoryRuntime.get();
}

export function inventoryDb(): unknown {
  return getInventoryRuntime().getDb();
}
