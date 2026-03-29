// Copyright (c) Better Data, Inc.
// SPDX-License-Identifier: Apache-2.0

import type {
  ScmProcurementPoAmended,
  ScmProcurementPoCancelled,
  ScmProcurementPoConfirmed,
  ScmProcurementPoCreated
} from "@betterdata/scm-contracts";
import { procurementEmitOutbox } from "../runtime";

type PrismaTransactionClient = Record<string, unknown>;

export type POHeaderStatus =
  | "PENDING"
  | "PLACED"
  | "PARTIALLY_SHIPPED"
  | "SHIPPED"
  | "PARTIALLY_RECEIVED"
  | "RECEIVED"
  | "PARTIALLY_INVOICED"
  | "INVOICED"
  | "COMPLETE"
  | "CANCELLED";

export type POLineStatus =
  | "PENDING"
  | "PARTIALLY_SHIPPED"
  | "SHIPPED"
  | "PARTIALLY_RECEIVED"
  | "RECEIVED"
  | "PARTIALLY_INVOICED"
  | "INVOICED"
  | "CANCELLED";

export type POAdjustmentStatus =
  | "PENDING"
  | "PARTIALLY_INVOICED"
  | "INVOICED"
  | "CANCELLED";

export interface ComputedPOStatus {
  headerStatus: POHeaderStatus;
  lineStatuses: Map<string, POLineStatus>;
  adjustmentStatuses: Map<string, POAdjustmentStatus>;
  summary: {
    totalLines: number;
    activeLines: number;
    cancelledLines: number;
    totalQty: number;
    shippedQty: number;
    receivedQty: number;
    invoicedQty: number;
    percentShipped: number;
    percentReceived: number;
    percentInvoiced: number;
    isComplete: boolean;
    isAdjustmentOnly: boolean;
  };
}

interface LineQuantities {
  id: string;
  qty: number;
  shippedQty: number;
  receivedQty: number;
  invoicedQty: number;
  isCancelled: boolean;
}

interface AdjustmentData {
  id: string;
  amount: number | null;
  invoicedAmount: number;
  isCancelled: boolean;
}

type ProcurementDbClient = Record<string, any>;

type TransitionInput = {
  organizationId: string;
  purchaseOrderId: string;
  actorId: string;
  correlationId: string;
  causationId?: string;
};

export class POStatusEngine {
  static computeLineStatus(line: LineQuantities): POLineStatus {
    if (line.isCancelled) return "CANCELLED";
    if (line.invoicedQty >= line.qty) return "INVOICED";
    if (line.invoicedQty > 0) return "PARTIALLY_INVOICED";
    if (line.receivedQty >= line.qty) return "RECEIVED";
    if (line.receivedQty > 0) return "PARTIALLY_RECEIVED";
    if (line.shippedQty >= line.qty) return "SHIPPED";
    if (line.shippedQty > 0) return "PARTIALLY_SHIPPED";
    return "PENDING";
  }

  static computeAdjustmentStatus(adjustment: AdjustmentData): POAdjustmentStatus {
    if (adjustment.isCancelled) return "CANCELLED";
    if (adjustment.invoicedAmount >= (adjustment.amount || 0)) return "INVOICED";
    if (adjustment.invoicedAmount > 0) return "PARTIALLY_INVOICED";
    return "PENDING";
  }

  static computeStatus(data: {
    lines: LineQuantities[];
    adjustments: AdjustmentData[];
    status: string;
  }): ComputedPOStatus {
    const lineStatuses = new Map<string, POLineStatus>();
    for (const line of data.lines) {
      lineStatuses.set(line.id, this.computeLineStatus(line));
    }
    const adjustmentStatuses = new Map<string, POAdjustmentStatus>();
    for (const adjustment of data.adjustments) {
      adjustmentStatuses.set(adjustment.id, this.computeAdjustmentStatus(adjustment));
    }
    const activeLines = data.lines.filter((line) => !line.isCancelled);
    const totalQty = activeLines.reduce((sum, line) => sum + line.qty, 0);
    const shippedQty = activeLines.reduce((sum, line) => sum + line.shippedQty, 0);
    const receivedQty = activeLines.reduce((sum, line) => sum + line.receivedQty, 0);
    const invoicedQty = activeLines.reduce((sum, line) => sum + line.invoicedQty, 0);
    const isComplete = activeLines.every(
      (line) => line.receivedQty >= line.qty && line.invoicedQty >= line.qty
    );
    return {
      headerStatus: (data.status as POHeaderStatus) || "PENDING",
      lineStatuses,
      adjustmentStatuses,
      summary: {
        totalLines: data.lines.length,
        activeLines: activeLines.length,
        cancelledLines: data.lines.length - activeLines.length,
        totalQty,
        shippedQty,
        receivedQty,
        invoicedQty,
        percentShipped: totalQty > 0 ? (shippedQty / totalQty) * 100 : 0,
        percentReceived: totalQty > 0 ? (receivedQty / totalQty) * 100 : 0,
        percentInvoiced: totalQty > 0 ? (invoicedQty / totalQty) * 100 : 0,
        isComplete,
        isAdjustmentOnly:
          activeLines.length === 0 && data.adjustments.filter((a) => !a.isCancelled).length > 0
      }
    };
  }

  static async getComputedStatus(
    prisma: ProcurementDbClient,
    poId: string
  ): Promise<ComputedPOStatus | null> {
    const po = await prisma.purchaseOrder.findUnique({
      where: { id: poId },
      include: {
        lines: {
          select: {
            id: true,
            qty: true,
            shippedQty: true,
            receivedQty: true,
            invoicedQty: true,
            isCancelled: true
          }
        },
        adjustments: {
          select: {
            id: true,
            amount: true,
            isCancelled: true
          }
        }
      }
    });
    if (!po) return null;
    return this.computeStatus({
      status: po.status,
      lines: po.lines.map((line: any) => ({
        id: line.id,
        qty: Number(line.qty),
        shippedQty: Number(line.shippedQty),
        receivedQty: Number(line.receivedQty),
        invoicedQty: Number(line.invoicedQty),
        isCancelled: !!line.isCancelled
      })),
      adjustments: po.adjustments.map((adjustment: any) => ({
        id: adjustment.id,
        amount: adjustment.amount ? Number(adjustment.amount) : null,
        invoicedAmount: 0,
        isCancelled: !!adjustment.isCancelled
      }))
    });
  }

  /**
   * Transition helper: create PO and emit `scm.procurement.po_created.v1` in same tx.
   */
  static async createPurchaseOrder(
    prisma: ProcurementDbClient,
    payload: TransitionInput & {
      supplierId: string;
      lineCount: number;
      createData: Record<string, unknown>;
    }
  ): Promise<{ id: string }> {
    return prisma.$transaction(async (tx: PrismaTransactionClient & ProcurementDbClient) => {
      const created = await (tx as any).purchaseOrder.create({ data: payload.createData });
      const event: ScmProcurementPoCreated = {
        eventId: crypto.randomUUID(),
        eventType: "scm.procurement.po_created.v1",
        occurredAt: new Date().toISOString(),
        correlationId: payload.correlationId,
        causationId: payload.causationId,
        schemaVersion: "1",
        payload: {
          organizationId: payload.organizationId,
          purchaseOrderId: created.id,
          supplierId: payload.supplierId,
          lineCount: payload.lineCount
        }
      };
      await procurementEmitOutbox(tx, {
        aggregateType: "scm.procurement",
        aggregateId: created.id,
        eventType: event.eventType,
        payload: event.payload,
        organizationId: payload.organizationId,
        correlationId: event.correlationId,
        causationId: event.causationId ?? event.eventId
      });
      return created;
    });
  }

  /**
   * Transition helper: confirm PO and emit `scm.procurement.po_confirmed.v1` in same tx.
   */
  static async confirmPurchaseOrder(
    prisma: ProcurementDbClient,
    payload: TransitionInput
  ): Promise<void> {
    await prisma.$transaction(async (tx: PrismaTransactionClient & ProcurementDbClient) => {
      await (tx as any).purchaseOrder.update({
        where: { id: payload.purchaseOrderId },
        data: { status: "PLACED", placedAt: new Date() }
      });
      const event: ScmProcurementPoConfirmed = {
        eventId: crypto.randomUUID(),
        eventType: "scm.procurement.po_confirmed.v1",
        occurredAt: new Date().toISOString(),
        correlationId: payload.correlationId,
        causationId: payload.causationId,
        schemaVersion: "1",
        payload: {
          organizationId: payload.organizationId,
          purchaseOrderId: payload.purchaseOrderId,
          confirmedAt: new Date().toISOString(),
          confirmedBy: payload.actorId
        }
      };
      await procurementEmitOutbox(tx, {
        aggregateType: "scm.procurement",
        aggregateId: payload.purchaseOrderId,
        eventType: event.eventType,
        payload: event.payload,
        organizationId: payload.organizationId,
        correlationId: event.correlationId,
        causationId: event.causationId ?? event.eventId
      });
    });
  }

  /**
   * Transition helper: amend PO and emit `scm.procurement.po_amended.v1` in same tx.
   */
  static async amendPurchaseOrder(
    prisma: ProcurementDbClient,
    payload: TransitionInput & { amendedFields: string[]; patch: Record<string, unknown> }
  ): Promise<void> {
    await prisma.$transaction(async (tx: PrismaTransactionClient & ProcurementDbClient) => {
      await (tx as any).purchaseOrder.update({
        where: { id: payload.purchaseOrderId },
        data: payload.patch
      });
      const event: ScmProcurementPoAmended = {
        eventId: crypto.randomUUID(),
        eventType: "scm.procurement.po_amended.v1",
        occurredAt: new Date().toISOString(),
        correlationId: payload.correlationId,
        causationId: payload.causationId,
        schemaVersion: "1",
        payload: {
          organizationId: payload.organizationId,
          purchaseOrderId: payload.purchaseOrderId,
          amendedAt: new Date().toISOString(),
          amendedBy: payload.actorId,
          amendedFields: payload.amendedFields
        }
      };
      await procurementEmitOutbox(tx, {
        aggregateType: "scm.procurement",
        aggregateId: payload.purchaseOrderId,
        eventType: event.eventType,
        payload: event.payload,
        organizationId: payload.organizationId,
        correlationId: event.correlationId,
        causationId: event.causationId ?? event.eventId
      });
    });
  }

  /**
   * Transition helper: cancel PO and emit `scm.procurement.po_cancelled.v1` in same tx.
   */
  static async cancelPurchaseOrder(
    prisma: ProcurementDbClient,
    payload: TransitionInput & { reason: string }
  ): Promise<void> {
    await prisma.$transaction(async (tx: PrismaTransactionClient & ProcurementDbClient) => {
      await (tx as any).purchaseOrder.update({
        where: { id: payload.purchaseOrderId },
        data: { status: "CANCELLED", cancelledAt: new Date() }
      });
      const event: ScmProcurementPoCancelled = {
        eventId: crypto.randomUUID(),
        eventType: "scm.procurement.po_cancelled.v1",
        occurredAt: new Date().toISOString(),
        correlationId: payload.correlationId,
        causationId: payload.causationId,
        schemaVersion: "1",
        payload: {
          organizationId: payload.organizationId,
          purchaseOrderId: payload.purchaseOrderId,
          reason: payload.reason
        }
      };
      await procurementEmitOutbox(tx, {
        aggregateType: "scm.procurement",
        aggregateId: payload.purchaseOrderId,
        eventType: event.eventType,
        payload: event.payload,
        organizationId: payload.organizationId,
        correlationId: event.correlationId,
        causationId: event.causationId ?? event.eventId
      });
    });
  }
}

export default POStatusEngine;
