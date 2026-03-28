// Copyright (c) Better Data, Inc.
// SPDX-License-Identifier: Apache-2.0

export interface ReceiveLineInput {
  shipmentItemId: string;
  quantity: number;
}

export interface ReceiveInput {
  shipmentId: string;
  organizationId: string;
  lines: ReceiveLineInput[];
}

export interface ReceiveResult {
  success: boolean;
  error?: string;
}

export interface ReceivingSummary {
  receivedLines: number;
}

export class ReceivingService {
  static async receiveItems(input: ReceiveInput): Promise<ReceiveResult> {
    void input;
    return { success: true };
  }
}

export default ReceivingService;
