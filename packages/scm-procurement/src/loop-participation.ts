// Copyright (c) Better Data, Inc.
// SPDX-License-Identifier: Apache-2.0

import { readChannelMessages, type EventChannelMessage, type PrismaTransactionClient } from "@betterdata/shared-event-bus";

export type ProcurementLoopEvent =
  | "scm.procurement.po_confirmed.v1"
  | "scm.execution.goods_received.v1";

export type ProcurementLoopParticipant = {
  module: "scm-procurement";
  handles: Array<{
    event: ProcurementLoopEvent;
    loops: string[];
  }>;
};

type CursorCapableClient = PrismaTransactionClient & {
  moduleEventCursor: {
    findUnique: (args: { where: { module_channel_organizationId: { module: string; channel: string; organizationId: string } } }) => Promise<{ lastProcessedMessageId: string | null } | null>;
    upsert: (args: {
      where: { module_channel_organizationId: { module: string; channel: string; organizationId: string } };
      create: { module: string; channel: string; organizationId: string; lastProcessedMessageId: string | null };
      update: { lastProcessedMessageId: string | null };
    }) => Promise<unknown>;
  };
};

export const procurementLoopParticipant: ProcurementLoopParticipant = {
  module: "scm-procurement",
  handles: [
    { event: "scm.procurement.po_confirmed.v1", loops: ["scm.procurement"] },
    { event: "scm.execution.goods_received.v1", loops: ["scm.procurement"] }
  ]
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
  const messages = await readChannelMessages(
    params.prisma,
    channel,
    cursor?.lastProcessedMessageId ?? undefined,
    params.limit ?? 50
  );
  let lastProcessedMessageId: string | null = cursor?.lastProcessedMessageId ?? null;
  for (const message of messages) {
    if (message.organizationId !== params.organizationId) continue;
    if (params.onMessage) {
      await params.onMessage(message);
    }
    lastProcessedMessageId = message.id;
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
  return { processed: messages.length, lastProcessedMessageId };
}
