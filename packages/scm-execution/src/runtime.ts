// Copyright (c) Better Data, Inc.
// SPDX-License-Identifier: Apache-2.0

import type { ChannelReader, OutboxWriteInput, OutboxWriter } from "@betterdata/scm-contracts";
import { createModuleRuntimeStore } from "@betterdata/scm-contracts";

export interface ExecutionRuntimeConfig {
  outbox: OutboxWriter;
  readChannelMessages: ChannelReader;
}

const executionRuntime = createModuleRuntimeStore<ExecutionRuntimeConfig>(
  "@betterdata/scm-execution",
  "configureExecutionRuntime({ outbox, readChannelMessages })"
);

export function configureExecutionRuntime(config: ExecutionRuntimeConfig): void {
  executionRuntime.configure(config);
}

export function getExecutionRuntime(): ExecutionRuntimeConfig {
  return executionRuntime.get();
}

export async function executionEmitOutbox(tx: unknown, event: OutboxWriteInput): Promise<void> {
  await getExecutionRuntime().outbox.write(tx, event);
}
