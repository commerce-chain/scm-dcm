// Copyright (c) Better Data, Inc.
// SPDX-License-Identifier: Apache-2.0

import type { EventChannelMessageRecord } from "@betterdata/scm-contracts";
import { getDcmOrdersRuntime } from "./runtime";

type EventChannelMessage = EventChannelMessageRecord;
type PrismaTransactionClient = Record<string, unknown>;

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

const CHANNELS = ["dcm-orders-events", "scm-inventory-events"] as const;

export async function processOrderLoopBatch(params: {
  prisma: PrismaTransactionClient;
  organizationId: string;
  limit?: number;
  onMessage?: (message: EventChannelMessage) => Promise<void>;
}): Promise<{ processed: number; lastProcessedMessageId: string | null }> {
  const db = params.prisma as CursorCapableClient;
  const moduleId = "dcm.orders";
  let processed = 0;
  let lastProcessedMessageId: string | null = null;

  for (const channel of CHANNELS) {
    const cursor = await db.moduleEventCursor.findUnique({
      where: {
        module_channel_organizationId: {
          module: moduleId,
          channel,
          organizationId: params.organizationId
        }
      }
    });
    const messages = await getDcmOrdersRuntime().readChannelMessages(
      params.prisma,
      channel,
      cursor?.lastProcessedMessageId ?? undefined,
      params.limit ?? 50
    );
    let channelLastProcessed = cursor?.lastProcessedMessageId ?? null;
    for (const message of messages) {
      if (message.organizationId !== params.organizationId) continue;
      if (params.onMessage) {
        await params.onMessage(message);
      }
      channelLastProcessed = message.id;
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
        lastProcessedMessageId: channelLastProcessed
      },
      update: {
        lastProcessedMessageId: channelLastProcessed
      }
    });
  }

  return { processed, lastProcessedMessageId };
}
