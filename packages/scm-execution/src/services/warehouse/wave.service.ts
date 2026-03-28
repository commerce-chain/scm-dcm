// Copyright (c) Better Data, Inc.
// SPDX-License-Identifier: Apache-2.0

import type { WaveOptimizationAdapter } from "../../adapters/wave-optimization.adapter";

export const WAVE_PICKING_ENABLED = "workflow.wms.wave_picking";

export type WaveType = "STANDARD" | "PRIORITY";
export type WaveStatus = "DRAFT" | "RELEASED" | "COMPLETED" | "CANCELLED";

export interface CreateWaveInput {
  organizationId: string;
  shipmentIds: string[];
  waveType?: WaveType;
}

export interface ReleaseWaveInput {
  waveId: string;
}

export interface ReleaseWaveResult {
  success: boolean;
}

export interface ShipmentForWave {
  shipmentId: string;
}

export interface GroupedShipments {
  groupId: string;
  shipments: ShipmentForWave[];
}

export class WaveService {
  static async createWave(
    input: CreateWaveInput,
    optimizationAdapter?: WaveOptimizationAdapter
  ): Promise<{ id: string; waveNumber: string }> {
    if (optimizationAdapter) {
      await optimizationAdapter.optimizeWave({
        organizationId: input.organizationId,
        shipmentIds: input.shipmentIds
      });
    }
    return { id: `wave_${Date.now()}`, waveNumber: `WV-${Date.now()}` };
  }
}

export default WaveService;
