// Copyright (c) Better Data, Inc.
// SPDX-License-Identifier: Apache-2.0

import type {
  ScmExecutionGoodsReceived,
  ScmExecutionShipmentPacked,
  ScmExecutionShipmentPicked,
  ScmExecutionShipmentShipped
} from "@betterdata/scm-contracts";
import { executionEmitOutbox } from "../runtime";

type PrismaTransactionClient = Record<string, unknown>;

type DbClient = Record<string, any>;

export type MovementStatus =
  | "DRAFT"
  | "PENDING"
  | "PICKING"
  | "PICKED"
  | "PACKING"
  | "PACKED"
  | "CHECKING"
  | "SHIPPED"
  | "IN_TRANSIT"
  | "RECEIVING"
  | "RECEIVED"
  | "COMPLETED"
  | "CANCELED";

export class MovementStatusEngine {
  static async transition(
    prisma: DbClient,
    params: {
      shipmentId: string;
      organizationId: string;
      from: MovementStatus;
      to: MovementStatus;
      actorId: string;
      correlationId: string;
      causationId?: string;
    }
  ): Promise<{ success: boolean; error?: string }> {
    try {
      await prisma.$transaction(async (tx: PrismaTransactionClient & DbClient) => {
        await tx.shipment.update({
          where: { id: params.shipmentId },
          data: { status: params.to, updatedAt: new Date() }
        });

        const occurredAt = new Date().toISOString();
        const maybeEvent = this.toEvent(params, occurredAt);
        if (maybeEvent) {
          await executionEmitOutbox(tx, {
            aggregateType: "scm.execution",
            aggregateId: params.shipmentId,
            eventType: maybeEvent.eventType,
            payload: maybeEvent.payload,
            organizationId: params.organizationId,
            correlationId: params.correlationId,
            causationId: params.causationId ?? params.correlationId
          });
        }
      });
      return { success: true };
    } catch (error: any) {
      return { success: false, error: error.message || "Transition failed" };
    }
  }

  private static toEvent(
    params: {
      shipmentId: string;
      organizationId: string;
      to: MovementStatus;
      actorId: string;
    },
    occurredAt: string
  ): { eventType: string; payload: Record<string, unknown> } | null {
    if (params.to === "PICKED") {
      return {
        eventType: "scm.execution.shipment_picked.v1",
        payload: {
          organizationId: params.organizationId,
          shipmentId: params.shipmentId,
          pickedAt: occurredAt,
          pickedBy: params.actorId
        } satisfies ScmExecutionShipmentPicked["payload"]
      };
    }
    if (params.to === "PACKED") {
      return {
        eventType: "scm.execution.shipment_packed.v1",
        payload: {
          organizationId: params.organizationId,
          shipmentId: params.shipmentId,
          packedAt: occurredAt,
          packedBy: params.actorId
        } satisfies ScmExecutionShipmentPacked["payload"]
      };
    }
    if (params.to === "SHIPPED") {
      return {
        eventType: "scm.execution.shipment_shipped.v1",
        payload: {
          organizationId: params.organizationId,
          shipmentId: params.shipmentId,
          shippedAt: occurredAt
        } satisfies ScmExecutionShipmentShipped["payload"]
      };
    }
    if (params.to === "RECEIVED") {
      return {
        eventType: "scm.execution.goods_received.v1",
        payload: {
          organizationId: params.organizationId,
          receiptId: params.shipmentId,
          receivedAt: occurredAt
        } satisfies ScmExecutionGoodsReceived["payload"]
      };
    }
    return null;
  }
}

export default MovementStatusEngine;
