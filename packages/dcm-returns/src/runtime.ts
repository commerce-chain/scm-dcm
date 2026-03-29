// Copyright (c) Better Data, Inc.
// SPDX-License-Identifier: Apache-2.0

import type { ChannelReader, OutboxWriteInput, OutboxWriter } from "@betterdata/scm-contracts";
import { createModuleRuntimeStore } from "@betterdata/scm-contracts";

export interface DcmReturnsRuntimeConfig {
  outbox: OutboxWriter;
  readChannelMessages: ChannelReader;
}

const dcmReturnsRuntime = createModuleRuntimeStore<DcmReturnsRuntimeConfig>(
  "@betterdata/dcm-returns",
  "configureDcmReturnsRuntime({ outbox, readChannelMessages })"
);

export function configureDcmReturnsRuntime(config: DcmReturnsRuntimeConfig): void {
  dcmReturnsRuntime.configure(config);
}

export function getDcmReturnsRuntime(): DcmReturnsRuntimeConfig {
  return dcmReturnsRuntime.get();
}

export async function dcmReturnsEmitOutbox(tx: unknown, event: OutboxWriteInput): Promise<void> {
  await getDcmReturnsRuntime().outbox.write(tx, event);
}
