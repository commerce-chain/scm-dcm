// Copyright (c) Better Data, Inc.
// SPDX-License-Identifier: Apache-2.0

import type { ChannelReader, OutboxWriteInput, OutboxWriter } from "@betterdata/scm-contracts";
import { createModuleRuntimeStore } from "@betterdata/scm-contracts";

export interface DcmOrdersRuntimeConfig {
  outbox: OutboxWriter;
  readChannelMessages: ChannelReader;
}

const dcmOrdersRuntime = createModuleRuntimeStore<DcmOrdersRuntimeConfig>(
  "@betterdata/dcm-orders",
  "configureDcmOrdersRuntime({ outbox, readChannelMessages })"
);

export function configureDcmOrdersRuntime(config: DcmOrdersRuntimeConfig): void {
  dcmOrdersRuntime.configure(config);
}

export function getDcmOrdersRuntime(): DcmOrdersRuntimeConfig {
  return dcmOrdersRuntime.get();
}

export async function dcmOrdersEmitOutbox(tx: unknown, event: OutboxWriteInput): Promise<void> {
  await getDcmOrdersRuntime().outbox.write(tx, event);
}
