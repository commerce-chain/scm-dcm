// Copyright (c) Better Data, Inc.
// SPDX-License-Identifier: Apache-2.0

import type { ChannelReader, OutboxWriteInput, OutboxWriter } from "@betterdata/scm-contracts";
import { createModuleRuntimeStore } from "@betterdata/scm-contracts";

export interface ProcurementRuntimeConfig {
  outbox: OutboxWriter;
  readChannelMessages: ChannelReader;
}

const procurementRuntime = createModuleRuntimeStore<ProcurementRuntimeConfig>(
  "@betterdata/scm-procurement",
  "configureProcurementRuntime({ outbox, readChannelMessages })"
);

export function configureProcurementRuntime(config: ProcurementRuntimeConfig): void {
  procurementRuntime.configure(config);
}

export function getProcurementRuntime(): ProcurementRuntimeConfig {
  return procurementRuntime.get();
}

export async function procurementEmitOutbox(tx: unknown, event: OutboxWriteInput): Promise<void> {
  await getProcurementRuntime().outbox.write(tx, event);
}
