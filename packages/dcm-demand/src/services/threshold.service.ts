// Copyright (c) Better Data, Inc.
// SPDX-License-Identifier: Apache-2.0

import type { DcmDemandThresholdBreachDetected } from "@betterdata/dcm-contracts";

export type ThresholdType =
  | "min_stock"
  | "max_stock"
  | "velocity_spike"
  | "forecast_deviation";

export interface ThresholdSignalInput {
  signalId: string;
  productId: string;
  locationId: string;
  organizationId: string;
  minStock?: number;
  maxStock?: number;
  forecastQty?: number;
  expectedVelocity?: number;
}

export interface InventorySnapshotInput {
  productId: string;
  locationId: string;
  onHandQty: number;
  velocityObserved?: number;
}

export class ThresholdService {
  detectBreaches(params: {
    signal: ThresholdSignalInput;
    snapshot: InventorySnapshotInput;
    now?: Date;
  }): DcmDemandThresholdBreachDetected[] {
    const { signal, snapshot } = params;
    const now = (params.now ?? new Date()).toISOString();
    const breaches: DcmDemandThresholdBreachDetected[] = [];

    if (typeof signal.minStock === "number" && snapshot.onHandQty < signal.minStock) {
      breaches.push(this.buildEvent(signal, "min_stock", snapshot.onHandQty, signal.minStock, now));
    }
    if (typeof signal.maxStock === "number" && snapshot.onHandQty > signal.maxStock) {
      breaches.push(this.buildEvent(signal, "max_stock", snapshot.onHandQty, signal.maxStock, now));
    }
    if (
      typeof signal.expectedVelocity === "number" &&
      typeof snapshot.velocityObserved === "number" &&
      snapshot.velocityObserved > signal.expectedVelocity
    ) {
      breaches.push(
        this.buildEvent(
          signal,
          "velocity_spike",
          snapshot.velocityObserved,
          signal.expectedVelocity,
          now
        )
      );
    }
    if (
      typeof signal.forecastQty === "number" &&
      Math.abs(snapshot.onHandQty - signal.forecastQty) > Math.max(1, signal.forecastQty * 0.25)
    ) {
      breaches.push(
        this.buildEvent(
          signal,
          "forecast_deviation",
          snapshot.onHandQty,
          signal.forecastQty,
          now
        )
      );
    }
    return breaches;
  }

  private buildEvent(
    signal: ThresholdSignalInput,
    thresholdType: ThresholdType,
    observedValue: number,
    thresholdValue: number,
    detectedAt: string
  ): DcmDemandThresholdBreachDetected {
    return {
      eventId: crypto.randomUUID(),
      eventType: "dcm.demand.threshold_breach_detected.v1",
      occurredAt: detectedAt,
      correlationId: signal.signalId,
      causationId: signal.signalId,
      schemaVersion: "1",
      payload: {
        organizationId: signal.organizationId,
        signalId: signal.signalId,
        productId: signal.productId,
        locationId: signal.locationId,
        thresholdType,
        observedValue,
        thresholdValue,
        detectedAt
      }
    };
  }
}
