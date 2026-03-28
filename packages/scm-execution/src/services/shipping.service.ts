// Copyright (c) Better Data, Inc.
// SPDX-License-Identifier: Apache-2.0

export interface ShipInput {
  shipmentId: string;
  organizationId: string;
  actorId: string;
}

export interface ShipResult {
  success: boolean;
  error?: string;
}

export class ShippingService {
  static async ship(_input: ShipInput): Promise<ShipResult> {
    return { success: true };
  }
}

export default ShippingService;
