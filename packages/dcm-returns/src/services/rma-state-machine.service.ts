// Copyright (c) Better Data, Inc.
// SPDX-License-Identifier: Apache-2.0

import type {
  DcmReturnReceived,
  DcmReturnsRmaApproved,
  DcmReturnsRmaRejected
} from "@betterdata/dcm-contracts";
import { writeOutboxEntry, type PrismaTransactionClient } from "@betterdata/shared-event-bus";

type DbClient = Record<string, any>;
type ReturnCondition = DcmReturnReceived["payload"]["condition"];

export class RmaStateMachineService {
  static async approveRma(params: {
    prisma: DbClient;
    organizationId: string;
    rmaId: string;
    actorId: string;
    correlationId: string;
    causationId?: string;
  }): Promise<void> {
    await params.prisma.$transaction(async (tx: PrismaTransactionClient & DbClient) => {
      const rma = await tx.rmaRequest.findFirst({
        where: { id: params.rmaId, organizationId: params.organizationId },
        select: { id: true, state: true }
      });
      if (!rma) throw new Error("RMA not found");
      if (rma.state !== "REQUESTED") throw new Error(`RMA must be REQUESTED, got ${rma.state}`);

      await tx.rmaRequest.update({
        where: { id: params.rmaId },
        data: { state: "APPROVED", approvedAt: new Date() }
      });

      const event: DcmReturnsRmaApproved = {
        eventId: crypto.randomUUID(),
        eventType: "dcm.returns.rma_approved.v1",
        occurredAt: new Date().toISOString(),
        correlationId: params.correlationId,
        causationId: params.causationId,
        schemaVersion: "1",
        payload: {
          organizationId: params.organizationId,
          rmaId: params.rmaId,
          approvedAt: new Date().toISOString(),
          approvedBy: params.actorId,
          correlationId: params.correlationId,
          causationId: params.causationId ?? params.correlationId
        }
      };
      await writeOutboxEntry(tx, {
        aggregateType: "dcm.returns",
        aggregateId: params.rmaId,
        eventType: event.eventType,
        payload: event.payload,
        organizationId: params.organizationId,
        correlationId: event.correlationId,
        causationId: event.causationId ?? event.eventId
      });
    });
  }

  static async rejectRma(params: {
    prisma: DbClient;
    organizationId: string;
    rmaId: string;
    actorId: string;
    rejectionReason: string;
    correlationId: string;
    causationId?: string;
  }): Promise<void> {
    await params.prisma.$transaction(async (tx: PrismaTransactionClient & DbClient) => {
      const rma = await tx.rmaRequest.findFirst({
        where: { id: params.rmaId, organizationId: params.organizationId },
        select: { id: true, state: true }
      });
      if (!rma) throw new Error("RMA not found");
      if (rma.state !== "REQUESTED") throw new Error(`RMA must be REQUESTED, got ${rma.state}`);

      await tx.rmaRequest.update({
        where: { id: params.rmaId },
        data: {
          state: "REJECTED",
          rejectedAt: new Date(),
          rejectionReason: params.rejectionReason
        }
      });

      const event: DcmReturnsRmaRejected = {
        eventId: crypto.randomUUID(),
        eventType: "dcm.returns.rma_rejected.v1",
        occurredAt: new Date().toISOString(),
        correlationId: params.correlationId,
        causationId: params.causationId,
        schemaVersion: "1",
        payload: {
          organizationId: params.organizationId,
          rmaId: params.rmaId,
          rejectedAt: new Date().toISOString(),
          rejectedBy: params.actorId,
          reason: params.rejectionReason,
          correlationId: params.correlationId,
          causationId: params.causationId ?? params.correlationId
        }
      };
      await writeOutboxEntry(tx, {
        aggregateType: "dcm.returns",
        aggregateId: params.rmaId,
        eventType: event.eventType,
        payload: event.payload,
        organizationId: params.organizationId,
        correlationId: event.correlationId,
        causationId: event.causationId ?? event.eventId
      });
    });
  }

  static async registerReturnLineReceipt(params: {
    prisma: DbClient;
    organizationId: string;
    rmaId: string;
    returnLineId: string;
    locationId: string;
    condition: ReturnCondition;
    correlationId: string;
    causationId?: string;
  }): Promise<void> {
    await params.prisma.$transaction(async (tx: PrismaTransactionClient & DbClient) => {
      const line = await tx.returnLine.findFirst({
        where: { id: params.returnLineId, rmaId: params.rmaId },
        select: { id: true, skuId: true, quantityReturned: true, state: true }
      });
      if (!line) throw new Error("Return line not found");

      await tx.returnLine.update({
        where: { id: params.returnLineId },
        data: {
          state: "RECEIVED",
          condition: params.condition,
          receivedAt: new Date()
        }
      });

      const stats = await tx.returnLine.groupBy({
        by: ["state"],
        where: { rmaId: params.rmaId },
        _count: { state: true }
      });
      const pendingCount = stats
        .filter((row: { state: string; _count: { state: number } }) => row.state === "PENDING")
        .reduce((sum: number, row: { _count: { state: number } }) => sum + row._count.state, 0);
      await tx.rmaRequest.update({
        where: { id: params.rmaId },
        data: {
          state: pendingCount > 0 ? "PARTIALLY_RECEIVED" : "FULLY_RECEIVED"
        }
      });

      const event: DcmReturnReceived = {
        eventId: crypto.randomUUID(),
        eventType: "dcm.returns.return_received.v1",
        occurredAt: new Date().toISOString(),
        correlationId: params.correlationId,
        causationId: params.causationId,
        schemaVersion: "1",
        payload: {
          organizationId: params.organizationId,
          returnId: params.rmaId,
          rmaId: params.rmaId,
          returnLineId: params.returnLineId,
          skuId: line.skuId,
          locationId: params.locationId,
          quantityReturned: Number(line.quantityReturned),
          condition: params.condition,
          receivedAt: new Date().toISOString(),
          disposition:
            params.condition === "RESELLABLE"
              ? "restock"
              : params.condition === "DAMAGED"
                ? "quarantine"
                : "write_off",
          correlationId: params.correlationId,
          causationId: params.causationId ?? params.correlationId
        }
      };
      await writeOutboxEntry(tx, {
        aggregateType: "dcm.returns",
        aggregateId: params.returnLineId,
        eventType: event.eventType,
        payload: event.payload,
        organizationId: params.organizationId,
        correlationId: event.correlationId,
        causationId: event.causationId ?? event.eventId
      });
    });
  }

  static async closeRmaIfComplete(params: {
    prisma: DbClient;
    organizationId: string;
    rmaId: string;
  }): Promise<boolean> {
    const result = await params.prisma.$transaction(async (tx: PrismaTransactionClient & DbClient) => {
      const rma = await tx.rmaRequest.findFirst({
        where: { id: params.rmaId, organizationId: params.organizationId },
        select: { id: true, state: true }
      });
      if (!rma || rma.state !== "FULLY_RECEIVED") return false;

      const remaining = await tx.returnLine.count({
        where: {
          rmaId: params.rmaId,
          state: { notIn: ["RESTOCKED", "DESTROYED"] }
        }
      });
      if (remaining > 0) return false;

      await tx.rmaRequest.update({
        where: { id: params.rmaId },
        data: { state: "CLOSED" }
      });
      return true;
    });
    return result;
  }
}
