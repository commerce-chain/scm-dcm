// Copyright (c) Better Data, Inc.
// SPDX-License-Identifier: Apache-2.0

export type ShipmentDocumentType = "PICKLIST" | "PACKING_LIST" | "BOL";

export interface DocumentUploadInput {
  shipmentId: string;
  documentType: ShipmentDocumentType;
  fileName: string;
}

export interface PicklistData {
  shipmentId: string;
}

export interface PackingListData {
  shipmentId: string;
}

export interface DocumentResult {
  success: boolean;
  url?: string;
  error?: string;
}

export class ShipmentDocumentService {
  static async uploadDocument(_input: DocumentUploadInput): Promise<DocumentResult> {
    return { success: true, url: "stub://document" };
  }
}

export default ShipmentDocumentService;
