// Copyright (c) Better Data, Inc.
// SPDX-License-Identifier: Apache-2.0

type ProcurementDbClient = Record<string, any>;

export interface ActualReadyDateImportRow {
  poNumber: string;
  lineNumber: number;
  actualReadyDate: string;
}

export interface ActualReadyDateImportResult {
  success: boolean;
  updatedCount: number;
  errors: Array<{ row: number; message: string }>;
}

export class ActualReadyDateImportService {
  static parseCSV(csvContent: string): ActualReadyDateImportRow[] {
    const lines = csvContent.split("\n").filter((line) => line.trim());
    if (lines.length < 2) return [];
    return lines.slice(1).map((line) => {
      const [poNumber, lineNumber, actualReadyDate] = line
        .split(",")
        .map((value) => value.replace(/"/g, "").trim());
      return {
        poNumber,
        lineNumber: parseInt(lineNumber, 10),
        actualReadyDate
      };
    });
  }

  static async importRows(
    prisma: ProcurementDbClient,
    organizationId: string,
    rows: ActualReadyDateImportRow[]
  ): Promise<ActualReadyDateImportResult> {
    const errors: Array<{ row: number; message: string }> = [];
    let updatedCount = 0;
    for (let i = 0; i < rows.length; i += 1) {
      const row = rows[i];
      try {
        const po = await prisma.purchaseOrder.findFirst({
          where: { number: row.poNumber, organizationId },
          select: { id: true }
        });
        if (!po) {
          errors.push({ row: i + 1, message: `PO not found: ${row.poNumber}` });
          continue;
        }
        const parsed = new Date(row.actualReadyDate);
        if (Number.isNaN(parsed.getTime())) {
          errors.push({ row: i + 1, message: `Invalid date: ${row.actualReadyDate}` });
          continue;
        }
        await prisma.pOLine.updateMany({
          where: { purchaseOrderId: po.id, lineNumber: row.lineNumber },
          data: { actualReadyDate: parsed }
        });
        updatedCount += 1;
      } catch (error: any) {
        errors.push({ row: i + 1, message: error.message || "Unknown error" });
      }
    }
    return { success: errors.length === 0, updatedCount, errors };
  }
}

export default ActualReadyDateImportService;
