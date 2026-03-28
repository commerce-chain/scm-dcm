// Copyright (c) Better Data, Inc.
// SPDX-License-Identifier: Apache-2.0

export interface InvoiceMatchingInput {
  organizationId: string;
  invoiceId: string;
  purchaseOrderId: string;
}

export interface InvoiceMatchingResult {
  matched: boolean;
  confidence?: number;
  notes?: string[];
}

/**
 * Reserved seam for future ML/proprietary invoice matching.
 * Not wired in Phase 3B.
 */
export interface InvoiceMatchingAdapter {
  matchInvoice(input: InvoiceMatchingInput): Promise<InvoiceMatchingResult>;
}
