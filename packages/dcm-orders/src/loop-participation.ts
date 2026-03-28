// Copyright (c) Better Data, Inc.
// SPDX-License-Identifier: Apache-2.0

import { readChannelMessages, type EventChannelMessage, type PrismaTransactionClient } from "@betterdata/shared-event-bus";

export type OrdersLoopEvent =
  | "dcm.orders.order_confirmed.v1"
  | "scm.inventory.stock_reserved.v1"
  | "scm.inventory.stock_reservation_failed.v1"
  | "dcm.orders.order_line_shipped.v1";

export type OrderLoopParticipant = {
  module: "dcm-orders";
  handles: Array<{
    event: OrdersLoopEvent;
    loops: string[];
  }>;
};

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

export const orderLoopParticipant: OrderLoopParticipant = {
  module: "dcm-orders",
  handles: [
    { event: "dcm.orders.order_confirmed.v1", loops: ["dcm.order"] },
    { event: "scm.inventory.stock_reserved.v1", loops: ["dcm.order"] },
    { event: "scm.inventory.stock_reservation_failed.v1", loops: ["dcm.order"] },
    { event: "dcm.orders.order_line_shipped.v1", loops: ["dcm.order"] }
  ]
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
    const messages = await readChannelMessages(
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
