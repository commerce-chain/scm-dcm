// Copyright (c) Better Data, Inc.
// SPDX-License-Identifier: Apache-2.0

import type {
  ScmExecutionGoodsReceived,
  ScmExecutionReceiptScheduled,
  ScmExecutionShipmentPacked,
  ScmExecutionShipmentPicked,
  ScmExecutionShipmentShipped
} from "@betterdata/scm-contracts";
import { writeOutboxEntry, type PrismaTransactionClient } from "@betterdata/shared-event-bus";

export type ShipmentStatus =
  | "DRAFT"
  | "PENDING"
  | "VERIFYING"
  | "PICKING"
  | "PICKED"
  | "PACKING"
  | "PACKED"
  | "CHECKING"
  | "SHIPPED"
  | "IN_TRANSIT"
  | "RECEIVING"
  | "RECEIVED"
  | "CANCELED"
  | "ON_HOLD";

export type ShipmentType = "OUTBOUND" | "INBOUND" | "TRANSFER" | "INTERNAL" | "RETURN";

export interface ShipmentContext {
  id: string;
  organizationId: string;
  shipmentType: ShipmentType;
  currentStatus: ShipmentStatus;
  purchaseOrderId?: string | null;
  destinationId?: string | null;
}

type DbClient = Record<string, any>;

const BASE_TRANSITIONS: Array<{ from: ShipmentStatus; to: ShipmentStatus }> = [
  { from: "DRAFT", to: "PENDING" },
  { from: "PENDING", to: "VERIFYING" },
  { from: "VERIFYING", to: "PICKING" },
  { from: "PICKING", to: "PICKED" },
  { from: "PICKED", to: "PACKING" },
  { from: "PACKING", to: "PACKED" },
  { from: "PACKED", to: "CHECKING" },
  { from: "CHECKING", to: "SHIPPED" },
  { from: "SHIPPED", to: "IN_TRANSIT" },
  { from: "IN_TRANSIT", to: "RECEIVING" },
  { from: "RECEIVING", to: "RECEIVED" },
  { from: "PENDING", to: "CANCELED" },
  { from: "ON_HOLD", to: "PENDING" }
];

export class ShipmentStateMachine {
  static canTransition(from: ShipmentStatus, to: ShipmentStatus): boolean {
    return BASE_TRANSITIONS.some((transition) => transition.from === from && transition.to === to);
  }

  static async transitionStatus(
    prisma: DbClient,
    params: {
      shipmentId: string;
      organizationId: string;
      toStatus: ShipmentStatus;
      actorId: string;
      correlationId: string;
      causationId?: string;
      purchaseOrderId?: string | null;
      destinationLocationId?: string | null;
    }
  ): Promise<{ success: boolean; fromStatus?: ShipmentStatus; toStatus?: ShipmentStatus; error?: string }> {
    try {
      return await prisma.$transaction(
        async (tx: PrismaTransactionClient & DbClient) => {
          const shipment = await tx.shipment.findFirst({
            where: { id: params.shipmentId, organizationId: params.organizationId },
            select: {
              id: true,
              status: true,
              purchaseOrderId: true,
              destinationLocationId: true
            }
          });
          if (!shipment) {
            return { success: false, error: "Shipment not found" };
          }

          const fromStatus = shipment.status as ShipmentStatus;
          if (!this.canTransition(fromStatus, params.toStatus)) {
            return {
              success: false,
              error: `Transition not allowed: ${fromStatus} -> ${params.toStatus}`
            };
          }

          await tx.shipment.update({
            where: { id: params.shipmentId },
            data: { status: params.toStatus, updatedAt: new Date() }
          });

          await this.emitTransitionEvent(tx, {
            shipmentId: params.shipmentId,
            organizationId: params.organizationId,
            toStatus: params.toStatus,
            actorId: params.actorId,
            correlationId: params.correlationId,
            causationId: params.causationId,
            purchaseOrderId: params.purchaseOrderId ?? shipment.purchaseOrderId,
            destinationLocationId: params.destinationLocationId ?? shipment.destinationLocationId
          });

          return { success: true, fromStatus, toStatus: params.toStatus };
        }
      );
    } catch (error: any) {
      return { success: false, error: error.message || "Unknown transition error" };
    }
  }

  private static async emitTransitionEvent(
    tx: PrismaTransactionClient,
    params: {
      shipmentId: string;
      organizationId: string;
      toStatus: ShipmentStatus;
      actorId: string;
      correlationId: string;
      causationId?: string;
      purchaseOrderId?: string | null;
      destinationLocationId?: string | null;
    }
  ): Promise<void> {
    const occurredAt = new Date().toISOString();
    const eventMap: Record<ShipmentStatus, { eventType: string; payload: Record<string, unknown> } | null> = {
      DRAFT: null,
      PENDING: {
        eventType: "scm.execution.receipt_scheduled.v1",
        payload: {
          organizationId: params.organizationId,
          shipmentId: params.shipmentId,
          purchaseOrderId: params.purchaseOrderId ?? undefined,
          scheduledAt: occurredAt,
          destinationLocationId: params.destinationLocationId ?? "unknown"
        } satisfies ScmExecutionReceiptScheduled["payload"]
      },
      VERIFYING: null,
      PICKING: null,
      PICKED: {
        eventType: "scm.execution.shipment_picked.v1",
        payload: {
          organizationId: params.organizationId,
          shipmentId: params.shipmentId,
          pickedAt: occurredAt,
          pickedBy: params.actorId
        } satisfies ScmExecutionShipmentPicked["payload"]
      },
      PACKING: null,
      PACKED: {
        eventType: "scm.execution.shipment_packed.v1",
        payload: {
          organizationId: params.organizationId,
          shipmentId: params.shipmentId,
          packedAt: occurredAt,
          packedBy: params.actorId
        } satisfies ScmExecutionShipmentPacked["payload"]
      },
      CHECKING: null,
      SHIPPED: {
        eventType: "scm.execution.shipment_shipped.v1",
        payload: {
          organizationId: params.organizationId,
          shipmentId: params.shipmentId,
          shippedAt: occurredAt
        } satisfies ScmExecutionShipmentShipped["payload"]
      },
      IN_TRANSIT: null,
      RECEIVING: null,
      RECEIVED: {
        eventType: "scm.execution.goods_received.v1",
        payload: {
          organizationId: params.organizationId,
          receiptId: params.shipmentId,
          purchaseOrderId: params.purchaseOrderId ?? undefined,
          receivedAt: occurredAt
        } satisfies ScmExecutionGoodsReceived["payload"]
      },
      CANCELED: null,
      ON_HOLD: null
    };

    const mapped = eventMap[params.toStatus];
    if (!mapped) return;

    await writeOutboxEntry(tx, {
      aggregateType: "scm.execution",
      aggregateId: params.shipmentId,
      eventType: mapped.eventType,
      payload: mapped.payload,
      organizationId: params.organizationId,
      correlationId: params.correlationId,
      causationId: params.causationId ?? params.correlationId
    });
  }
}

export default ShipmentStateMachine;
