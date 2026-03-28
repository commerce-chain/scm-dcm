// Copyright (c) Better Data, Inc.
// SPDX-License-Identifier: Apache-2.0

export interface CreateTransferInput {
  organizationId: string;
  originLocationId: string;
  destinationLocationId: string;
}

export interface TransferItemInput {
  productId: string;
  quantity: number;
}

export interface TransferResult {
  success: boolean;
  transferId?: string;
  error?: string;
}

export class TransferService {
  static async createTransfer(_input: CreateTransferInput): Promise<TransferResult> {
    return { success: true, transferId: `tr_${Date.now()}` };
  }
}

export default TransferService;
