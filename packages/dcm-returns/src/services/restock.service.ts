// Copyright (c) Better Data, Inc.
// SPDX-License-Identifier: Apache-2.0

import type { DcmReturnReceived, DcmReturnsReturnRestocked } from "@betterdata/dcm-contracts";
import type { EventChannelMessageRecord } from "@betterdata/scm-contracts";
import { dcmReturnsEmitOutbox, getDcmReturnsRuntime } from "../runtime";

type EventChannelMessage = EventChannelMessageRecord;
type PrismaTransactionClient = Record<string, unknown>;

type DbClient = Record<string, any>;
type ReturnCondition = DcmReturnReceived["payload"]["condition"];

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
  outboxEntry: {
    findUnique: (args: { where: { id: string }; select: { eventType: true } }) => Promise<{ eventType: string } | null>;
  };
};

export class RestockService {
  static async processInventoryReturnEvents(params: {
    prisma: DbClient & PrismaTransactionClient;
    organizationId: string;
    limit?: number;
  }): Promise<{ processed: number; lastProcessedMessageId: string | null }> {
    const db = params.prisma as DbClient & CursorCapableClient;
    const moduleId = "dcm.returns";
    const channel = "scm-inventory-events";
    const cursor = await db.moduleEventCursor.findUnique({
      where: {
        module_channel_organizationId: {
          module: moduleId,
          channel,
          organizationId: params.organizationId
        }
      }
    });
    const messages = await getDcmReturnsRuntime().readChannelMessages(
      params.prisma,
      channel,
      cursor?.lastProcessedMessageId ?? undefined,
      params.limit ?? 50
    );
    let processed = 0;
    let lastProcessedMessageId: string | null = cursor?.lastProcessedMessageId ?? null;
    for (const message of messages) {
      if (message.organizationId !== params.organizationId) continue;
      const outbox = await db.outboxEntry.findUnique({
        where: { id: message.outboxEntryId },
        select: { eventType: true }
      });
      if (outbox?.eventType !== "scm.inventory.stock_returned.v1") continue;
      const payload = message.payload as any;
      await this.markRestocked(params.prisma, {
        organizationId: params.organizationId,
        rmaId: payload.rmaId,
        skuId: payload.skuId,
        locationId: payload.locationId,
        quantityReturned: Number(payload.quantityReturned),
        condition: payload.condition,
        correlationId: payload.correlationId,
        causationId: payload.causationId
      });
      processed += 1;
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
    return { processed, lastProcessedMessageId };
  }

  static async markRestocked(
    prisma: DbClient & PrismaTransactionClient,
    params: {
      organizationId: string;
      rmaId: string;
      skuId: string;
      locationId: string;
      quantityReturned: number;
      condition: ReturnCondition;
      correlationId: string;
      causationId: string;
    }
  ): Promise<void> {
    await prisma.$transaction(async (tx: DbClient & PrismaTransactionClient) => {
      const line = await tx.returnLine.findFirst({
        where: {
          rmaId: params.rmaId,
          skuId: params.skuId
        },
        select: { id: true }
      });
      if (!line) return;
      await tx.returnLine.update({
        where: { id: line.id },
        data: {
          state: params.condition === "DESTROYED" ? "DESTROYED" : "RESTOCKED",
          restockedAt: new Date()
        }
      });
      const event: DcmReturnsReturnRestocked = {
        eventId: crypto.randomUUID(),
        eventType: "dcm.returns.return_restocked.v1",
        occurredAt: new Date().toISOString(),
        correlationId: params.correlationId,
        causationId: params.causationId,
        schemaVersion: "1",
        payload: {
          organizationId: params.organizationId,
          rmaId: params.rmaId,
          skuId: params.skuId,
          locationId: params.locationId,
          quantityRestocked: params.quantityReturned,
          restockedAt: new Date().toISOString(),
          correlationId: params.correlationId,
          causationId: params.causationId
        }
      };
      await dcmReturnsEmitOutbox(tx, {
        aggregateType: "dcm.returns",
        aggregateId: line.id,
        eventType: event.eventType,
        payload: event.payload,
        organizationId: params.organizationId,
        correlationId: event.correlationId,
        causationId: event.causationId ?? event.eventId
      });
    });
  }
}
