// Copyright (c) Better Data, Inc.
// SPDX-License-Identifier: Apache-2.0

import { POPermissions } from "./permissions.service";

type ProcurementDbClient = Record<string, any>;

export interface ExportOptions {
  includeReadOnlyFields?: boolean;
  format?: "csv" | "json";
}

export interface ImportRow {
  lineNumber?: number;
  lineId?: string;
  sourceCode?: string;
  recipientId?: string;
  recipient?: string;
  estReadyDate?: string;
  actualReadyDate?: string;
  unitPrice?: string | number;
  budgetCode?: string;
  budgetCodeId?: string;
}

export interface ValidationError {
  lineNumber: number;
  field: string;
  message: string;
  value?: unknown;
}

export interface ImportPreview {
  valid: boolean;
  errors: ValidationError[];
  changes: Array<{
    lineNumber: number;
    lineId: string;
    productName: string;
    field: string;
    oldValue: unknown;
    newValue: unknown;
    canApply: boolean;
    blockReason?: string;
  }>;
  summary: {
    totalLines: number;
    linesWithChanges: number;
    linesWithErrors: number;
    linesBlocked: number;
  };
}

export interface ImportResult {
  success: boolean;
  updatedCount: number;
  skippedCount: number;
  errors: ValidationError[];
}

export class POLinesBulkUpdateService {
  static async exportLines(
    prisma: ProcurementDbClient,
    organizationId: string,
    poId: string,
    options: ExportOptions = {}
  ): Promise<{ data: any[]; csv: string; poNumber: string }> {
    void options;
    const po = await prisma.purchaseOrder.findFirst({
      where: { id: poId, organizationId },
      include: {
        lines: { orderBy: { lineNumber: "asc" } }
      }
    });
    if (!po) throw new Error("Purchase order not found");
    const data = po.lines.map((line: any) => ({
      lineId: line.id,
      lineNumber: line.lineNumber,
      sourceCode: line.sourceCodeId || "",
      recipientId: line.recipientPartyId || "",
      estReadyDate: line.estReadyDate?.toISOString?.().split("T")[0] || "",
      actualReadyDate: line.actualReadyDate?.toISOString?.().split("T")[0] || "",
      unitPrice: line.unitCost?.toString?.() || "0",
      budgetCodeId: line.budgetCodeId || ""
    }));
    const headers = [
      "Line ID",
      "Line #",
      "Source Code",
      "Recipient ID",
      "Est Ready Date",
      "Actual Ready Date",
      "Unit Price",
      "Budget Code ID"
    ];
    const csvRows = [
      headers.join(","),
      ...data.map((row: any) =>
        [
          row.lineId,
          row.lineNumber,
          row.sourceCode,
          row.recipientId,
          row.estReadyDate,
          row.actualReadyDate,
          row.unitPrice,
          row.budgetCodeId
        ]
          .map((cell) => `"${cell}"`)
          .join(",")
      )
    ];
    return { data, csv: csvRows.join("\n"), poNumber: po.number };
  }

  static async previewImport(
    prisma: ProcurementDbClient,
    organizationId: string,
    authContext: { userId: string; organizationId: string; roles: string[]; isSuperAdmin?: boolean },
    poId: string,
    rows: ImportRow[]
  ): Promise<ImportPreview> {
    const userContext = POPermissions.getUserContextFromAuthContext(authContext);
    const po = await prisma.purchaseOrder.findFirst({
      where: { id: poId, organizationId },
      include: { lines: { include: { productMaster: true } } }
    });
    if (!po) {
      return {
        valid: false,
        errors: [{ lineNumber: 0, field: "poId", message: "Purchase order not found" }],
        changes: [],
        summary: { totalLines: rows.length, linesWithChanges: 0, linesWithErrors: 1, linesBlocked: 0 }
      };
    }
    const canEditPO = POPermissions.canEdit(userContext, {
      id: po.id,
      organizationId: po.organizationId,
      status: po.status,
      hasShipments: false,
      hasInvoices: false,
      hasPrepaidLines: false,
      createdByUserId: po.createdByUserId
    });
    if (!canEditPO.allowed) {
      return {
        valid: false,
        errors: [{ lineNumber: 0, field: "permission", message: canEditPO.reason || "Cannot edit PO" }],
        changes: [],
        summary: { totalLines: rows.length, linesWithChanges: 0, linesWithErrors: 1, linesBlocked: 0 }
      };
    }
    return {
      valid: true,
      errors: [],
      changes: [],
      summary: { totalLines: rows.length, linesWithChanges: 0, linesWithErrors: 0, linesBlocked: 0 }
    };
  }

  static async applyImport(
    prisma: ProcurementDbClient,
    organizationId: string,
    authContext: { userId: string; organizationId: string; roles: string[]; isSuperAdmin?: boolean },
    poId: string,
    rows: ImportRow[]
  ): Promise<ImportResult> {
    const preview = await this.previewImport(prisma, organizationId, authContext, poId, rows);
    if (!preview.valid) {
      return {
        success: false,
        updatedCount: 0,
        skippedCount: rows.length,
        errors: preview.errors
      };
    }
    return {
      success: true,
      updatedCount: 0,
      skippedCount: rows.length,
      errors: []
    };
  }

  static parseCSV(csvContent: string): ImportRow[] {
    const lines = csvContent.split("\n").filter((line) => line.trim());
    if (lines.length < 2) return [];
    return lines.slice(1).map((line) => {
      const values = line.split(",").map((value) => value.replace(/"/g, "").trim());
      return {
        lineId: values[0] || undefined,
        lineNumber: values[1] ? parseInt(values[1], 10) : undefined,
        sourceCode: values[2] || undefined,
        recipientId: values[3] || undefined,
        estReadyDate: values[4] || undefined,
        actualReadyDate: values[5] || undefined,
        unitPrice: values[6] || undefined,
        budgetCodeId: values[7] || undefined
      };
    });
  }
}

export default POLinesBulkUpdateService;
