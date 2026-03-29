// Copyright (c) Better Data, Inc.
// SPDX-License-Identifier: Apache-2.0

import type { EventChannelMessageRecord } from "@betterdata/scm-contracts";
import { getProcurementRuntime } from "./runtime";

type PrismaTransactionClient = Record<string, unknown>;
type EventChannelMessage = EventChannelMessageRecord;

type CursorCapableClient = PrismaTransactionClient & {
  moduleEventCursor: {
    findUnique: (args: {
      where: { module_channel_organizationId: { module: string; channel: string; organizationId: string } };
    }) => Promise<{ lastProcessedMessageId: string | null } | null>;
    upsert: (args: {
      where: { module_channel_organizationId: { module: string; channel: string; organizationId: string } };
      create: { module: string; channel: string; organizationId: string; lastProcessedMessageId: string | null };
      update: { lastProcessedMessageId: string | null };
    }) => Promise<unknown>;
  };
};

export async function processProcurementLoopBatch(params: {
  prisma: PrismaTransactionClient;
  organizationId: string;
  limit?: number;
  onMessage?: (message: EventChannelMessage) => Promise<void>;
}): Promise<{ processed: number; lastProcessedMessageId: string | null }> {
  const db = params.prisma as CursorCapableClient;
  const moduleId = "scm.procurement";
  const channel = "scm-procurement-events";
  const cursor = await db.moduleEventCursor.findUnique({
    where: {
      module_channel_organizationId: {
        module: moduleId,
        channel,
        organizationId: params.organizationId
      }
    }
  });
  const messages = await getProcurementRuntime().readChannelMessages(
    params.prisma,
    channel,
    cursor?.lastProcessedMessageId ?? undefined,
    params.limit ?? 50
  );
  let lastProcessedMessageId: string | null = cursor?.lastProcessedMessageId ?? null;
  let processed = 0;
  for (const message of messages) {
    if (message.organizationId !== params.organizationId) continue;
    if (params.onMessage) {
      await params.onMessage(message);
    }
    lastProcessedMessageId = message.id;
    processed += 1;
  }
  await db.moduleEventCursor.upsert({
    where: {
      module_channel_organizationId: {
        module: moduleId,
        channel,
        organizationId: params.organizationId
      }
    },
    create: {
      module: moduleId,
      channel,
      organizationId: params.organizationId,
      lastProcessedMessageId
    },
    update: { lastProcessedMessageId }
  });
  return { processed, lastProcessedMessageId };
}
