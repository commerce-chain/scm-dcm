// Copyright (c) Better Data, Inc.
// SPDX-License-Identifier: Apache-2.0

type DbClient = Record<string, any>;

export interface ExecutionFeedbackResponse {
  shipments: Array<Record<string, unknown>>;
  summary: {
    total: number;
    delayed: number;
    partialReceipts: number;
    inTransit: number;
    onTimePercent: number;
    otifPercent: number;
    verifiedRecommendations: number;
  };
  verifications: Array<Record<string, unknown>>;
  auditTrail: Array<Record<string, unknown>>;
}

export async function getExecutionFeedback(
  _organizationId: string,
  _filters: Record<string, unknown> = {},
  _db?: DbClient
): Promise<ExecutionFeedbackResponse> {
  return {
    shipments: [],
    summary: {
      total: 0,
      delayed: 0,
      partialReceipts: 0,
      inTransit: 0,
      onTimePercent: 0,
      otifPercent: 0,
      verifiedRecommendations: 0
    },
    verifications: [],
    auditTrail: []
  };
}
