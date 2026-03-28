// Copyright (c) Better Data, Inc.
// SPDX-License-Identifier: Apache-2.0

export interface CreditIssuanceInput {
  organizationId: string;
  rmaId: string;
  returnLineId: string;
  amount: number;
  currencyCode: string;
  correlationId: string;
}

export interface CreditIssuanceResult {
  creditMemoId: string;
  issuedAt: string;
}

/**
 * Billing integration seam for issuing customer credits.
 * No billing implementation is included in this OSS package.
 */
export interface CreditIssuanceAdapter {
  issueCredit(input: CreditIssuanceInput): Promise<CreditIssuanceResult>;
}
