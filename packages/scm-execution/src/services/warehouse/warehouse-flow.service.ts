// Copyright (c) Better Data, Inc.
// SPDX-License-Identifier: Apache-2.0

export class WarehouseFlowService {
  static async assignFlow(_input: { shipmentId: string; locationId: string }): Promise<{ success: boolean }> {
    return { success: true };
  }
}

export default WarehouseFlowService;
