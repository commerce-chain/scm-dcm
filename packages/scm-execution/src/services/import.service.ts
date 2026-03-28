// Copyright (c) Better Data, Inc.
// SPDX-License-Identifier: Apache-2.0

export interface ImportRow {
  shipmentNumber?: string;
  productCode?: string;
  quantity?: number;
}

export interface ImportValidationError {
  rowNumber: number;
  message: string;
}

export interface ImportResult {
  success: boolean;
  errors: ImportValidationError[];
}

export class ShipmentImportService {
  static async runImport(_rows: ImportRow[]): Promise<ImportResult> {
    return { success: true, errors: [] };
  }
}

export default ShipmentImportService;
