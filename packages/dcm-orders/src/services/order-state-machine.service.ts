// Copyright (c) Better Data, Inc.
// SPDX-License-Identifier: Apache-2.0

import type {
  DcmOrdersOrderCancelled,
  DcmOrdersOrderConfirmed,
  DcmOrdersOrderLineAllocationRequested,
  DcmOrdersOrderLineShipped
} from "@betterdata/dcm-contracts";
import { writeOutboxEntry, type PrismaTransactionClient } from "@betterdata/shared-event-bus";

export type OrderState =
  | "DRAFT"
  | "CONFIRMED"
  | "ALLOCATION_PENDING"
  | "ALLOCATED"
  | "SHIPPED"
  | "CANCELLED";

export type OrderLineState =
  | "PENDING"
  | "ALLOCATION_PENDING"
  | "ALLOCATED"
  | "ALLOCATION_FAILED"
  | "SHIPPED"
  | "CANCELLED";

export interface CreateOrderLineInput {
  skuId: string;
  locationId?: string;
  quantityRequested: number;
}

export interface CreateDraftOrderInput {
  organizationId: string;
  correlationId: string;
  lines: CreateOrderLineInput[];
}

export interface OrderTransitionInput {
  organizationId: string;
  orderId: string;
  actorId: string;
  correlationId: string;
  causationId?: string;
}

type DcmOrdersDbClient = Record<string, any>;

type DcmOrderLineRecord = {
  id: string;
  skuId: string;
  locationId: string | null;
  quantityRequested: number;
};

type DcmOrderRecord = {
  id: string;
  organizationId: string;
  state: OrderState;
  lines: DcmOrderLineRecord[];
};

export class OrderStateMachine {
  static async createDraftOrder(
    prisma: DcmOrdersDbClient,
    input: CreateDraftOrderInput
  ): Promise<{ orderId: string }> {
    const created = await (prisma as any).dcmOrder.create({
      data: {
        organizationId: input.organizationId,
        state: "DRAFT",
        correlationId: input.correlationId,
        lines: {
          create: input.lines.map((line) => ({
            organizationId: input.organizationId,
            skuId: line.skuId,
            locationId: line.locationId ?? null,
            quantityRequested: line.quantityRequested,
            quantityAllocated: 0,
            state: "PENDING",
            correlationId: input.correlationId
          }))
        }
      },
      select: { id: true }
    });
    return { orderId: created.id };
  }

  static async confirmOrder(
    prisma: DcmOrdersDbClient,
    input: OrderTransitionInput
  ): Promise<{ orderId: string; lineCount: number }> {
    return (prisma as any).$transaction(async (tx: PrismaTransactionClient & DcmOrdersDbClient) => {
      const order = (await tx.dcmOrder.findFirst({
        where: { id: input.orderId, organizationId: input.organizationId },
        include: {
          lines: {
            select: {
              id: true,
              skuId: true,
              locationId: true,
              quantityRequested: true
            }
          }
        }
      })) as DcmOrderRecord | null;
      if (!order) {
        throw new Error("Order not found");
      }
      if (order.state !== "DRAFT") {
        throw new Error(`Order must be DRAFT to confirm, got ${order.state}`);
      }

      await tx.dcmOrder.update({
        where: { id: order.id },
        data: {
          state: "CONFIRMED",
          confirmedAt: new Date()
        }
      });

      const confirmedEvent: DcmOrdersOrderConfirmed = {
        eventId: crypto.randomUUID(),
        eventType: "dcm.orders.order_confirmed.v1",
        occurredAt: new Date().toISOString(),
        correlationId: input.correlationId,
        causationId: input.causationId,
        schemaVersion: "1",
        payload: {
          organizationId: input.organizationId,
          orderId: order.id,
          correlationId: input.correlationId,
          causationId: input.causationId ?? input.correlationId
        }
      };
      await writeOutboxEntry(tx, {
        aggregateType: "dcm.orders",
        aggregateId: order.id,
        eventType: confirmedEvent.eventType,
        payload: confirmedEvent.payload,
        organizationId: input.organizationId,
        correlationId: confirmedEvent.correlationId,
        causationId: confirmedEvent.causationId ?? confirmedEvent.eventId
      });

      await tx.dcmOrder.update({
        where: { id: order.id },
        data: {
          state: "ALLOCATION_PENDING",
          lines: {
            updateMany: {
              where: { orderId: order.id },
              data: { state: "ALLOCATION_PENDING" }
            }
          }
        }
      });

      for (const line of order.lines) {
        const lineEvent: DcmOrdersOrderLineAllocationRequested = {
          eventId: crypto.randomUUID(),
          eventType: "dcm.orders.order_line_allocation_requested.v1",
          occurredAt: new Date().toISOString(),
          correlationId: input.correlationId,
          causationId: confirmedEvent.eventId,
          schemaVersion: "1",
          payload: {
            organizationId: input.organizationId,
            orderId: order.id,
            orderLineId: line.id,
            skuId: line.skuId,
            locationId: line.locationId ?? "unassigned",
            quantityRequested: Number(line.quantityRequested),
            correlationId: input.correlationId,
            causationId: confirmedEvent.eventId
          }
        };
        await writeOutboxEntry(tx, {
          aggregateType: "dcm.orders",
          aggregateId: line.id,
          eventType: lineEvent.eventType,
          payload: lineEvent.payload,
          organizationId: input.organizationId,
          correlationId: lineEvent.correlationId,
          causationId: lineEvent.causationId ?? lineEvent.eventId
        });
      }

      return { orderId: order.id, lineCount: order.lines.length };
    });
  }

  static async markLineShipped(
    prisma: DcmOrdersDbClient,
    input: OrderTransitionInput & {
      orderLineId: string;
      shipmentId: string;
      quantityShipped: number;
    }
  ): Promise<void> {
    await (prisma as any).$transaction(async (tx: PrismaTransactionClient & DcmOrdersDbClient) => {
      const order = await tx.dcmOrder.findFirst({
        where: { id: input.orderId, organizationId: input.organizationId },
        select: { id: true, state: true }
      });
      if (!order) {
        throw new Error("Order not found");
      }
      if (order.state !== "ALLOCATED") {
        throw new Error(`Order must be ALLOCATED to ship line, got ${order.state}`);
      }

      await tx.dcmOrderLine.update({
        where: { id: input.orderLineId },
        data: {
          state: "SHIPPED",
          quantityAllocated: input.quantityShipped
        }
      });

      const shippedEvent: DcmOrdersOrderLineShipped = {
        eventId: crypto.randomUUID(),
        eventType: "dcm.orders.order_line_shipped.v1",
        occurredAt: new Date().toISOString(),
        correlationId: input.correlationId,
        causationId: input.causationId,
        schemaVersion: "1",
        payload: {
          organizationId: input.organizationId,
          orderId: input.orderId,
          orderLineId: input.orderLineId,
          shipmentId: input.shipmentId,
          quantityShipped: input.quantityShipped,
          correlationId: input.correlationId,
          causationId: input.causationId ?? input.correlationId
        }
      };
      await writeOutboxEntry(tx, {
        aggregateType: "dcm.orders",
        aggregateId: input.orderLineId,
        eventType: shippedEvent.eventType,
        payload: shippedEvent.payload,
        organizationId: input.organizationId,
        correlationId: shippedEvent.correlationId,
        causationId: shippedEvent.causationId ?? shippedEvent.eventId
      });

      const pendingLines = await tx.dcmOrderLine.count({
        where: {
          orderId: input.orderId,
          state: { notIn: ["SHIPPED", "CANCELLED"] }
        }
      });
      if (pendingLines === 0) {
        await tx.dcmOrder.update({
          where: { id: input.orderId },
          data: { state: "SHIPPED" }
        });
      }
    });
  }

  static async cancelOrder(
    prisma: DcmOrdersDbClient,
    input: OrderTransitionInput & { reason?: string }
  ): Promise<void> {
    await (prisma as any).$transaction(async (tx: PrismaTransactionClient & DcmOrdersDbClient) => {
      const order = await tx.dcmOrder.findFirst({
        where: { id: input.orderId, organizationId: input.organizationId },
        select: { id: true, state: true }
      });
      if (!order) {
        throw new Error("Order not found");
      }
      if (order.state !== "CONFIRMED" && order.state !== "ALLOCATED") {
        throw new Error(`Order must be CONFIRMED or ALLOCATED to cancel, got ${order.state}`);
      }

      await tx.dcmOrder.update({
        where: { id: input.orderId },
        data: {
          state: "CANCELLED",
          cancelledAt: new Date(),
          lines: {
            updateMany: {
              where: { orderId: input.orderId },
              data: { state: "CANCELLED" }
            }
          }
        }
      });

      const cancelledEvent: DcmOrdersOrderCancelled = {
        eventId: crypto.randomUUID(),
        eventType: "dcm.orders.order_cancelled.v1",
        occurredAt: new Date().toISOString(),
        correlationId: input.correlationId,
        causationId: input.causationId,
        schemaVersion: "1",
        payload: {
          organizationId: input.organizationId,
          orderId: input.orderId,
          reason: input.reason,
          correlationId: input.correlationId,
          causationId: input.causationId ?? input.correlationId
        }
      };
      await writeOutboxEntry(tx, {
        aggregateType: "dcm.orders",
        aggregateId: input.orderId,
        eventType: cancelledEvent.eventType,
        payload: cancelledEvent.payload,
        organizationId: input.organizationId,
        correlationId: cancelledEvent.correlationId,
        causationId: cancelledEvent.causationId ?? cancelledEvent.eventId
      });
    });
  }
}
