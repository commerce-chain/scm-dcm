// Copyright (c) Better Data, Inc.
// SPDX-License-Identifier: Apache-2.0

import type { DcmOrdersOrderLineAllocationFailed } from "@betterdata/dcm-contracts";
import type { EventChannelMessageRecord } from "@betterdata/scm-contracts";
import { dcmOrdersEmitOutbox, getDcmOrdersRuntime } from "../runtime";

type EventChannelMessage = EventChannelMessageRecord;
type PrismaTransactionClient = Record<string, unknown>;

type DcmOrdersDbClient = Record<string, any>;

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

export class AllocationResponseService {
  static async processBatch(params: {
    prisma: DcmOrdersDbClient & PrismaTransactionClient;
    organizationId: string;
    limit?: number;
    onMessage?: (message: EventChannelMessage) => Promise<void>;
  }): Promise<{ processed: number; lastProcessedMessageId: string | null }> {
    const db = params.prisma as CursorCapableClient & DcmOrdersDbClient;
    const moduleId = "dcm.orders";
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
    const messages = await getDcmOrdersRuntime().readChannelMessages(
      params.prisma,
      channel,
      cursor?.lastProcessedMessageId ?? undefined,
      params.limit ?? 50
    );

    let lastProcessedMessageId: string | null = cursor?.lastProcessedMessageId ?? null;
    let processed = 0;
    for (const message of messages) {
      if (message.organizationId !== params.organizationId) {
        continue;
      }
      await this.handleMessage(params.prisma as CursorCapableClient & DcmOrdersDbClient, message);
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

  static async handleMessage(
    prisma: CursorCapableClient & DcmOrdersDbClient,
    message: EventChannelMessage
  ): Promise<void> {
    const outbox = await prisma.outboxEntry.findUnique({
      where: { id: message.outboxEntryId },
      select: { eventType: true }
    });
    const eventType = outbox?.eventType;
    const payload = (message.payload as any)?.payload ?? message.payload;
    if (eventType === "scm.inventory.stock_reserved.v1") {
      await this.handleStockReserved(prisma, payload);
      return;
    }
    if (eventType === "scm.inventory.stock_reservation_failed.v1") {
      await this.handleStockReservationFailed(prisma, payload);
    }
  }

  private static async handleStockReserved(
    prisma: DcmOrdersDbClient & PrismaTransactionClient,
    payload: any
  ): Promise<void> {
    await (prisma as any).$transaction(async (tx: DcmOrdersDbClient & PrismaTransactionClient) => {
      await tx.dcmOrderLine.update({
        where: { id: payload.orderLineId },
        data: {
          state: "ALLOCATED",
          reservationId: payload.reservationId,
          locationId: payload.locationId ?? null,
          quantityAllocated: payload.quantityReserved
        }
      });
      const remaining = await tx.dcmOrderLine.count({
        where: {
          orderId: payload.orderId,
          state: { in: ["PENDING", "ALLOCATION_PENDING", "ALLOCATION_FAILED"] }
        }
      });
      if (remaining === 0) {
        await tx.dcmOrder.update({
          where: { id: payload.orderId },
          data: { state: "ALLOCATED" }
        });
      }
    });
  }

  private static async handleStockReservationFailed(
    prisma: DcmOrdersDbClient & PrismaTransactionClient,
    payload: any
  ): Promise<void> {
    await (prisma as any).$transaction(async (tx: DcmOrdersDbClient & PrismaTransactionClient) => {
      await tx.dcmOrderLine.update({
        where: { id: payload.orderLineId },
        data: {
          state: "ALLOCATION_FAILED",
          allocationFailureReason: `requested=${payload.quantityRequested},available=${payload.quantityAvailable}`
        }
      });

      const allocationFailedEvent: DcmOrdersOrderLineAllocationFailed = {
        eventId: crypto.randomUUID(),
        eventType: "dcm.orders.order_line_allocation_failed.v1",
        occurredAt: new Date().toISOString(),
        correlationId: payload.correlationId,
        causationId: payload.causationId,
        schemaVersion: "1",
        payload: {
          organizationId: payload.organizationId,
          orderId: payload.orderId,
          orderLineId: payload.orderLineId,
          skuId: payload.skuId,
          quantityRequested: payload.quantityRequested,
          quantityAvailable: payload.quantityAvailable,
          correlationId: payload.correlationId,
          causationId: payload.causationId
        }
      };
      await dcmOrdersEmitOutbox(tx, {
        aggregateType: "dcm.orders",
        aggregateId: payload.orderLineId,
        eventType: allocationFailedEvent.eventType,
        payload: allocationFailedEvent.payload,
        organizationId: payload.organizationId,
        correlationId: allocationFailedEvent.correlationId,
        causationId: allocationFailedEvent.causationId ?? allocationFailedEvent.eventId
      });
    });
  }
}
