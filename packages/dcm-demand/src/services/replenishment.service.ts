// Copyright (c) Better Data, Inc.
// SPDX-License-Identifier: Apache-2.0

import type {
  DcmDemandReplenishmentTriggered,
  DcmDemandThresholdBreachDetected
} from "@betterdata/dcm-contracts";

export interface ReplenishmentPolicyInput {
  minOrderQty?: number;
  maxOrderQty?: number;
  defaultReason?: string;
}

export class ReplenishmentService {
  triggerFromBreaches(
    breaches: DcmDemandThresholdBreachDetected[],
    policy: ReplenishmentPolicyInput = {}
  ): DcmDemandReplenishmentTriggered[] {
    return breaches.map((breach) => {
      const recommendedQty = this.calculateQty(breach, policy);
      const triggeredAt = new Date().toISOString();
      return {
        eventId: this.eventId(),
        eventType: "dcm.demand.replenishment_triggered.v1",
        occurredAt: triggeredAt,
        correlationId: breach.correlationId,
        causationId: breach.eventId,
        schemaVersion: "1",
        payload: {
          organizationId: breach.payload.organizationId,
          signalId: breach.payload.signalId,
          productId: breach.payload.productId,
          locationId: breach.payload.locationId,
          reason: policy.defaultReason ?? `threshold:${breach.payload.thresholdType}`,
          recommendedQty,
          triggeredAt
        }
      };
    });
  }

  private calculateQty(
    breach: DcmDemandThresholdBreachDetected,
    policy: ReplenishmentPolicyInput
  ): number {
    const delta = Math.max(0, breach.payload.thresholdValue - breach.payload.observedValue);
    const minQty = Math.max(1, policy.minOrderQty ?? 1);
    const maxQty = Math.max(minQty, policy.maxOrderQty ?? Number.MAX_SAFE_INTEGER);
    return Math.max(minQty, Math.min(maxQty, Math.ceil(delta)));
  }

  private eventId(): string {
    return `evt_${Date.now()}_${Math.random().toString(16).slice(2, 10)}`;
  }
}
