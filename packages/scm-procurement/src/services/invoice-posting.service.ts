// Copyright (c) Better Data, Inc.
// SPDX-License-Identifier: Apache-2.0

import type { ScmProcurementInvoiceMatchTriggered } from "@betterdata/scm-contracts";
import { procurementEmitOutbox } from "../runtime";

type PrismaTransactionClient = Record<string, unknown>;
import type { InvoiceMatchingAdapter } from "../adapters/invoice-matching.adapter";

type ProcurementDbClient = Record<string, any>;

export interface InvoicePostResult {
  success: boolean;
  error?: string;
  invoice?: {
    id: string;
    status: string;
    postedAt: Date;
    type: string;
  };
  linesPosted: number;
  adjustmentsPosted: number;
  poLinesUpdated: number;
}

export interface InvoiceValidationResult {
  canPost: boolean;
  issues: string[];
  warnings: string[];
}

export class InvoicePostingService {
  static async validateForPosting(
    prisma: ProcurementDbClient,
    invoiceId: string,
    organizationId: string
  ): Promise<InvoiceValidationResult> {
    const issues: string[] = [];
    const warnings: string[] = [];
    const invoice = await prisma.purchaseInvoice.findFirst({
      where: { id: invoiceId, organizationId },
      include: { lines: true, adjustments: true, po: { select: { placedAt: true } } }
    });
    if (!invoice) return { canPost: false, issues: ["Invoice not found"], warnings: [] };
    if (invoice.status !== "PENDING") {
      issues.push(`Invoice is ${invoice.status}, can only post PENDING invoices`);
    }
    if (invoice.lines.length === 0 && invoice.adjustments.length === 0) {
      issues.push("Invoice must have at least one line or adjustment");
    }
    if (!invoice.po?.placedAt) {
      issues.push("Cannot post invoice for PO that is not yet placed");
    }
    return { canPost: issues.length === 0, issues, warnings };
  }

  static async postInvoice(
    prisma: ProcurementDbClient,
    invoiceId: string,
    organizationId: string,
    userId: string,
    invoiceMatchingAdapter?: InvoiceMatchingAdapter
  ): Promise<InvoicePostResult> {
    const validation = await this.validateForPosting(prisma, invoiceId, organizationId);
    if (!validation.canPost) {
      return {
        success: false,
        error: validation.issues.join("; "),
        linesPosted: 0,
        adjustmentsPosted: 0,
        poLinesUpdated: 0
      };
    }
    const invoice = await prisma.purchaseInvoice.findFirst({
      where: { id: invoiceId, organizationId },
      include: { lines: true, adjustments: true }
    });
    if (!invoice) {
      return { success: false, error: "Invoice not found", linesPosted: 0, adjustmentsPosted: 0, poLinesUpdated: 0 };
    }
    const postedAt = new Date();
    let poLinesUpdated = 0;
    await prisma.$transaction(async (tx: PrismaTransactionClient & ProcurementDbClient) => {
      await (tx as any).purchaseInvoice.update({
        where: { id: invoiceId },
        data: { status: "POSTED", postedAt, postedById: userId }
      });
      if (invoice.type === "PURCHASE") {
        for (const line of invoice.lines) {
          if (line.isInversePrepay) continue;
          await (tx as any).pOLine.update({
            where: { id: line.poLineId },
            data: { invoicedQty: { increment: Number(line.qty) } }
          });
          poLinesUpdated += 1;
        }
      }
      if (invoiceMatchingAdapter) {
        await invoiceMatchingAdapter.matchInvoice({
          organizationId,
          invoiceId,
          purchaseOrderId: invoice.poId
        });
      }
      const matchEvent: ScmProcurementInvoiceMatchTriggered = {
        eventId: crypto.randomUUID(),
        eventType: "scm.procurement.invoice_match_triggered.v1",
        occurredAt: new Date().toISOString(),
        correlationId: invoiceId,
        causationId: invoiceId,
        schemaVersion: "1",
        payload: {
          organizationId,
          invoiceId,
          purchaseOrderId: invoice.poId,
          triggeredBy: userId
        }
      };
      await procurementEmitOutbox(tx, {
        aggregateType: "scm.procurement",
        aggregateId: invoice.poId,
        eventType: matchEvent.eventType,
        payload: matchEvent.payload,
        organizationId,
        correlationId: matchEvent.correlationId,
        causationId: matchEvent.causationId ?? matchEvent.eventId
      });
    });
    return {
      success: true,
      invoice: { id: invoiceId, status: "POSTED", postedAt, type: invoice.type },
      linesPosted: invoice.lines.length,
      adjustmentsPosted: invoice.adjustments.length,
      poLinesUpdated
    };
  }
}

export default InvoicePostingService;
