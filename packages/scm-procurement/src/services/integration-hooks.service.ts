// Copyright (c) Better Data, Inc.
// SPDX-License-Identifier: Apache-2.0

import type { ExternalIntegrationAdapter } from "../adapters/external-integration.adapter";
import { POStatusEngine } from "./status-engine.service";

type ProcurementDbClient = Record<string, any>;

interface ShipmentPostingData {
  shipmentId: string;
  poId: string;
  items: Array<{ poLineId: string; quantity: number }>;
  userId: string;
  organizationId: string;
}

interface ReceiptPostingData {
  receiptId: string;
  poId: string;
  items: Array<{ poLineId: string; quantity: number }>;
  userId: string;
  organizationId: string;
}

interface InvoicePostingData {
  invoiceId: string;
  poId: string;
  lines: Array<{ poLineId: string; quantity: number; amount: number }>;
  adjustments?: Array<{ poAdjustmentId: string; amount: number }>;
  userId: string;
  organizationId: string;
}

interface HookResult {
  success: boolean;
  error?: string;
  statusBefore?: string;
  statusAfter?: string;
  autoClosedPO?: boolean;
}

export class POIntegrationHooks {
  static async onShipmentPosted(
    prisma: ProcurementDbClient,
    data: ShipmentPostingData,
    integrations?: ExternalIntegrationAdapter
  ): Promise<HookResult> {
    try {
      const statusBefore = await POStatusEngine.getComputedStatus?.(prisma, data.poId);
      await prisma.$transaction(async (tx: any) => {
        for (const item of data.items) {
          await tx.pOLine.update({
            where: { id: item.poLineId },
            data: { shippedQty: { increment: item.quantity } }
          });
        }
      });
      const statusAfter = await POStatusEngine.getComputedStatus?.(prisma, data.poId);
      await integrations?.createAuditLog?.({
        actor: data.userId,
        action: "po.shipment_posted",
        resource: "PURCHASE_ORDER",
        resourceId: data.poId,
        organizationId: data.organizationId,
        before: { headerStatus: statusBefore?.headerStatus },
        after: { headerStatus: statusAfter?.headerStatus },
        metadata: { shipmentId: data.shipmentId, itemCount: data.items.length },
        status: "success"
      });
      return {
        success: true,
        statusBefore: statusBefore?.headerStatus,
        statusAfter: statusAfter?.headerStatus
      };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  }

  static async onReceiptPosted(
    prisma: ProcurementDbClient,
    data: ReceiptPostingData,
    integrations?: ExternalIntegrationAdapter
  ): Promise<HookResult> {
    try {
      const statusBefore = await POStatusEngine.getComputedStatus?.(prisma, data.poId);
      await prisma.$transaction(async (tx: any) => {
        for (const item of data.items) {
          await tx.pOLine.update({
            where: { id: item.poLineId },
            data: { receivedQty: { increment: item.quantity } }
          });
        }
      });
      const statusAfter = await POStatusEngine.getComputedStatus?.(prisma, data.poId);
      await integrations?.createAuditLog?.({
        actor: data.userId,
        action: "po.receipt_posted",
        resource: "PURCHASE_ORDER",
        resourceId: data.poId,
        organizationId: data.organizationId,
        before: { headerStatus: statusBefore?.headerStatus },
        after: { headerStatus: statusAfter?.headerStatus },
        metadata: { receiptId: data.receiptId, itemCount: data.items.length },
        status: "success"
      });
      return {
        success: true,
        statusBefore: statusBefore?.headerStatus,
        statusAfter: statusAfter?.headerStatus
      };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  }

  static async onInvoicePosted(
    prisma: ProcurementDbClient,
    data: InvoicePostingData,
    integrations?: ExternalIntegrationAdapter
  ): Promise<HookResult> {
    try {
      const statusBefore = await POStatusEngine.getComputedStatus?.(prisma, data.poId);
      await prisma.$transaction(async (tx: any) => {
        for (const line of data.lines) {
          await tx.pOLine.update({
            where: { id: line.poLineId },
            data: { invoicedQty: { increment: line.quantity } }
          });
        }
      });
      const statusAfter = await POStatusEngine.getComputedStatus?.(prisma, data.poId);
      await integrations?.createAuditLog?.({
        actor: data.userId,
        action: "po.invoice_posted",
        resource: "PURCHASE_ORDER",
        resourceId: data.poId,
        organizationId: data.organizationId,
        before: { headerStatus: statusBefore?.headerStatus },
        after: { headerStatus: statusAfter?.headerStatus },
        metadata: { invoiceId: data.invoiceId, lineCount: data.lines.length },
        status: "success"
      });
      return {
        success: true,
        statusBefore: statusBefore?.headerStatus,
        statusAfter: statusAfter?.headerStatus
      };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  }
}

export default POIntegrationHooks;
