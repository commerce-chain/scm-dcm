// Copyright (c) Better Data, Inc.
// SPDX-License-Identifier: Apache-2.0

export class ShipmentEditService {
  static async editHeader(_input: { shipmentId: string; patch: Record<string, unknown> }): Promise<{ success: boolean }> {
    return { success: true };
  }
}

export default ShipmentEditService;
