// Copyright (c) Better Data, Inc.
// SPDX-License-Identifier: Apache-2.0

export interface CreateContainerInput {
  shipmentId: string;
  containerType: string;
}

export interface PackItemInput {
  shipmentItemId: string;
  quantity: number;
  containerId: string;
}

export interface PackResult {
  success: boolean;
  error?: string;
}

export interface PackingListLine {
  shipmentItemId: string;
  quantity: number;
}

export interface PackingSummary {
  containerCount: number;
  itemCount: number;
}

export class PackingService {
  static async completePacking(_input: { shipmentId: string }): Promise<PackResult> {
    return { success: true };
  }
}

export default PackingService;
