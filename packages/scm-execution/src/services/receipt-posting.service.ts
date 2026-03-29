// Copyright (c) Better Data, Inc.
// SPDX-License-Identifier: Apache-2.0

import type {
  ScmExecutionGoodsReceived,
  ScmExecutionReceiptScheduled,
  ScmProcurementPoConfirmed
} from "@betterdata/scm-contracts";
import type { EventChannelMessageRecord } from "@betterdata/scm-contracts";
import { executionEmitOutbox, getExecutionRuntime } from "../runtime";

type EventChannelMessage = EventChannelMessageRecord;
type PrismaTransactionClient = Record<string, unknown>;

type DbClient = Record<string, any>;

type CursorClient = DbClient & {
  moduleEventCursor: {
    findUnique: (args: {
      where: {
        module_channel_organizationId: {
          module: string;
          channel: string;
          organizationId: string;
        };
      };
    }) => Promise<{ lastProcessedMessageId: string | null } | null>;
    upsert: (args: {
      where: {
        module_channel_organizationId: {
          module: string;
          channel: string;
          organizationId: string;
        };
      };
      create: {
        module: string;
        channel: string;
        organizationId: string;
        lastProcessedMessageId: string | null;
      };
      update: {
        lastProcessedMessageId: string | null;
      };
    }) => Promise<unknown>;
  };
};

export class ReceiptPostingService {
  /**
   * Replaces direct procurement service call by consuming procurement channel events.
   */
  static async processProcurementConfirmedEvents(
    prisma: DbClient,
    organizationId: string,
    limit = 50
  ): Promise<{ consumed: number; emitted: number; lastProcessedMessageId: string | null }> {
    const db = prisma as CursorClient;
    const moduleId = "scm.execution";
    const channel = "scm-procurement-events";
    const cursor = await db.moduleEventCursor.findUnique({
      where: {
        module_channel_organizationId: {
          module: moduleId,
          channel,
          organizationId
        }
      }
    });

    const messages = await getExecutionRuntime().readChannelMessages(
      prisma as PrismaTransactionClient,
      channel,
      cursor?.lastProcessedMessageId ?? undefined,
      limit
    );

    let emitted = 0;
    let lastProcessedMessageId: string | null = cursor?.lastProcessedMessageId ?? null;
    for (const message of messages) {
      if (message.organizationId !== organizationId) continue;
      const payload = message.payload as { eventType?: string } & Record<string, unknown>;
      if (payload.eventType !== "scm.procurement.po_confirmed.v1") {
        lastProcessedMessageId = message.id;
        continue;
      }

      await this.emitReceiptScheduled(prisma, organizationId, message);
      emitted += 1;
      lastProcessedMessageId = message.id;
    }

    await db.moduleEventCursor.upsert({
      where: {
        module_channel_organizationId: {
          module: moduleId,
          channel,
          organizationId
        }
      },
      create: { module: moduleId, channel, organizationId, lastProcessedMessageId },
      update: { lastProcessedMessageId }
    });

    return { consumed: messages.length, emitted, lastProcessedMessageId };
  }

  private static async emitReceiptScheduled(
    prisma: DbClient,
    organizationId: string,
    message: EventChannelMessage
  ): Promise<void> {
    const procurementPayload = message.payload as ScmProcurementPoConfirmed["payload"];
    const purchaseOrderId = procurementPayload.purchaseOrderId;
    const destinationLocationId = "unassigned";

    await prisma.$transaction(async (tx: PrismaTransactionClient & DbClient) => {
      const event: ScmExecutionReceiptScheduled = {
        eventId: crypto.randomUUID(),
        eventType: "scm.execution.receipt_scheduled.v1",
        occurredAt: new Date().toISOString(),
        correlationId: message.correlationId,
        causationId: message.id,
        schemaVersion: "1",
        payload: {
          organizationId,
          shipmentId: purchaseOrderId,
          purchaseOrderId,
          scheduledAt: new Date().toISOString(),
          destinationLocationId
        }
      };
      await executionEmitOutbox(tx, {
        aggregateType: "scm.execution",
        aggregateId: purchaseOrderId,
        eventType: event.eventType,
        payload: event.payload,
        organizationId,
        correlationId: event.correlationId,
        causationId: event.causationId ?? event.eventId
      });
    });
  }

  /**
   * Replaces direct inventory service call by emitting goods-received events.
   * Inventory updates become eventually consistent via relay + scm-inventory consumer.
   */
  static async postReceipt(
    prisma: DbClient,
    params: {
      receiptId: string;
      organizationId: string;
      userId: string;
      shipmentId?: string;
      purchaseOrderId?: string;
    }
  ): Promise<{ success: boolean; eventId?: string; error?: string }> {
    try {
      let eventId = "";
      await prisma.$transaction(async (tx: PrismaTransactionClient & DbClient) => {
        await tx.receipt.update({
          where: { id: params.receiptId },
          data: { status: "POSTED", postedAt: new Date(), postedByUserId: params.userId }
        });

        eventId = crypto.randomUUID();
        const event: ScmExecutionGoodsReceived = {
          eventId,
          eventType: "scm.execution.goods_received.v1",
          occurredAt: new Date().toISOString(),
          correlationId: params.receiptId,
          causationId: params.shipmentId ?? params.receiptId,
          schemaVersion: "1",
          payload: {
            organizationId: params.organizationId,
            receiptId: params.receiptId,
            purchaseOrderId: params.purchaseOrderId,
            receivedAt: new Date().toISOString()
          }
        };

        await executionEmitOutbox(tx, {
          aggregateType: "scm.execution",
          aggregateId: params.receiptId,
          eventType: event.eventType,
          payload: event.payload,
          organizationId: params.organizationId,
          correlationId: event.correlationId,
          causationId: event.causationId ?? event.eventId
        });
      });

      return { success: true, eventId };
    } catch (error: any) {
      return { success: false, error: error.message || "Failed to post receipt" };
    }
  }
}

export default ReceiptPostingService;
