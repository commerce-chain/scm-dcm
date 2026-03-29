// Copyright (c) Better Data, Inc.
// SPDX-License-Identifier: Apache-2.0

export interface DomainEvent {
  eventId: string;
  eventType: string;
  occurredAt: string;
  correlationId: string;
  causationId?: string;
  schemaVersion: string;
  /** Aggregate root ID when the event pertains to a single aggregate (may also appear on payload). */
  aggregateId?: string;
  /** Aggregate optimistic-concurrency version at emit time when tracked (may also appear on payload). */
  version?: number;
}

export interface DomainCommand {
  commandId: string;
  commandType: string;
  requestedAt: string;
  correlationId: string;
  causationId?: string;
  schemaVersion: string;
}

export type EventEnvelope<TType extends string, TPayload extends Record<string, unknown>> = DomainEvent & {
  eventType: TType;
  payload: TPayload;
};

export type CommandEnvelope<TType extends string, TPayload extends Record<string, unknown>> =
  DomainCommand & {
    commandType: TType;
    payload: TPayload;
  };

export type DcmModuleId =
  | "dcm.demand"
  | "dcm.orders"
  | "dcm.returns";

export interface InternalBootstrapRequest {
  organizationId: string;
  moduleId: DcmModuleId;
  correlationId: string;
  config?: Record<string, unknown>;
}

export interface InternalBootstrapResponse {
  ok: boolean;
  stepsExecuted: string[];
  warning?: string;
}

export interface InternalBackfillRequest {
  organizationId: string;
  moduleId: DcmModuleId;
  correlationId: string;
  fromVersion?: string;
}

export interface InternalBackfillResponse {
  ok: boolean;
  recordsProcessed: number;
  warning?: string;
}

export interface InternalHealthRequest {
  moduleId: DcmModuleId;
  organizationId: string;
}

export interface InternalHealthResponse {
  moduleId: DcmModuleId;
  organizationId: string;
  healthy: boolean;
  details?: string;
}

/**
 * Regulatory alignment note:
 * These compliance audit contracts are intended to support evidence export
 * workflows for regulated operations (for example, healthcare/pharma audits).
 * They define transport shape only and do not prescribe retention policy.
 */
export interface ComplianceAuditTrailRequest {
  organizationId?: string;
  source?: string;
  loopType?: string;
  aggregateId?: string;
  from?: string;
  to?: string;
  format?: "json" | "csv";
  limit?: number;
  offset?: number;
}

export interface ComplianceAuditTrailRow {
  id: string;
  timestamp: string;
  sourceModel: "AuditLog" | "BillingAuditLog" | "LoopStateTransition";
  organizationId: string;
  loopType: string | null;
  aggregateId: string | null;
  action: string;
  actorId: string;
  actorType: string;
  entityType: string;
  entityId: string;
  source: string;
}

export interface ComplianceAuditTrailResponse {
  rows: ComplianceAuditTrailRow[];
  pagination: {
    limit: number;
    offset: number;
    returned: number;
  };
}

export type DcmDemandForecastGenerated = EventEnvelope<
  "dcm.demand.forecast_generated.v1",
  {
    organizationId: string;
    forecastId: string;
    horizonDays: number;
    seriesCount: number;
  }
>;

export type DcmDemandSignalCaptured = EventEnvelope<
  "dcm.demand.signal_captured.v1",
  {
    organizationId: string;
    signalId: string;
    source: "manual" | "integration" | "model";
    value: number;
  }
>;

export type DcmDemandThresholdBreachDetected = EventEnvelope<
  "dcm.demand.threshold_breach_detected.v1",
  {
    organizationId: string;
    signalId: string;
    productId: string;
    locationId: string;
    thresholdType: "min_stock" | "max_stock" | "velocity_spike" | "forecast_deviation";
    observedValue: number;
    thresholdValue: number;
    detectedAt: string;
  }
>;

export type DcmDemandReplenishmentTriggered = EventEnvelope<
  "dcm.demand.replenishment_triggered.v1",
  {
    organizationId: string;
    signalId: string;
    productId: string;
    locationId: string;
    reason: string;
    recommendedQty: number;
    triggeredAt: string;
  }
>;

export type DcmOrderCreated = EventEnvelope<
  "dcm.orders.order_created.v1",
  {
    organizationId: string;
    orderId: string;
    channel: string;
    itemCount: number;
  }
>;

export type DcmOrderFulfilled = EventEnvelope<
  "dcm.orders.order_fulfilled.v1",
  {
    organizationId: string;
    orderId: string;
    shipmentId: string;
    fulfilledAt: string;
  }
>;

export type DcmOrdersOrderLineAllocationRequested = EventEnvelope<
  "dcm.orders.order_line_allocation_requested.v1",
  {
    organizationId: string;
    orderId: string;
    orderLineId: string;
    skuId: string;
    locationId: string;
    quantityRequested: number;
    correlationId: string;
    causationId: string;
  }
>;

export type DcmOrdersOrderConfirmed = EventEnvelope<
  "dcm.orders.order_confirmed.v1",
  {
    organizationId: string;
    orderId: string;
    correlationId: string;
    causationId: string;
  }
>;

export type DcmOrdersOrderCancelled = EventEnvelope<
  "dcm.orders.order_cancelled.v1",
  {
    organizationId: string;
    orderId: string;
    reason?: string;
    correlationId: string;
    causationId: string;
  }
>;

export type DcmOrdersOrderLineShipped = EventEnvelope<
  "dcm.orders.order_line_shipped.v1",
  {
    organizationId: string;
    orderId: string;
    orderLineId: string;
    shipmentId: string;
    quantityShipped: number;
    correlationId: string;
    causationId: string;
  }
>;

export type DcmOrdersOrderLineAllocationFailed = EventEnvelope<
  "dcm.orders.order_line_allocation_failed.v1",
  {
    organizationId: string;
    orderId: string;
    orderLineId: string;
    skuId: string;
    quantityRequested: number;
    quantityAvailable: number;
    correlationId: string;
    causationId: string;
  }
>;

export type DcmReturnInitiated = EventEnvelope<
  "dcm.returns.return_initiated.v1",
  {
    organizationId: string;
    returnId: string;
    orderId: string;
    reasonCode: string;
  }
>;

export type DcmReturnsRmaRequested = EventEnvelope<
  "dcm.returns.rma_requested.v1",
  {
    organizationId: string;
    rmaId: string;
    orderId: string;
    reasonCode: string;
    requestedAt: string;
    correlationId: string;
    causationId: string;
  }
>;

export type DcmReturnsRmaApproved = EventEnvelope<
  "dcm.returns.rma_approved.v1",
  {
    organizationId: string;
    rmaId: string;
    approvedAt: string;
    approvedBy: string;
    correlationId: string;
    causationId: string;
  }
>;

export type DcmReturnsRmaRejected = EventEnvelope<
  "dcm.returns.rma_rejected.v1",
  {
    organizationId: string;
    rmaId: string;
    rejectedAt: string;
    rejectedBy: string;
    reason: string;
    correlationId: string;
    causationId: string;
  }
>;

export type DcmReturnReceived = EventEnvelope<
  "dcm.returns.return_received.v1",
  {
    organizationId: string;
    returnId: string;
    rmaId: string;
    returnLineId: string;
    skuId: string;
    locationId: string;
    quantityReturned: number;
    condition: "RESELLABLE" | "DAMAGED" | "DESTROYED";
    receivedAt: string;
    disposition: "restock" | "quarantine" | "write_off";
    correlationId: string;
    causationId: string;
  }
>;

export type DcmReturnsReturnRestocked = EventEnvelope<
  "dcm.returns.return_restocked.v1",
  {
    organizationId: string;
    rmaId: string;
    skuId: string;
    locationId: string;
    quantityRestocked: number;
    restockedAt: string;
    correlationId: string;
    causationId: string;
  }
>;

export type DcmReturnsReturnCredited = EventEnvelope<
  "dcm.returns.return_credited.v1",
  {
    organizationId: string;
    rmaId: string;
    creditMemoId: string;
    amountCredited: number;
    currencyCode: string;
    creditedAt: string;
    correlationId: string;
    causationId: string;
  }
>;

export type DcmEvent =
  | DcmDemandForecastGenerated
  | DcmDemandSignalCaptured
  | DcmDemandThresholdBreachDetected
  | DcmDemandReplenishmentTriggered
  | DcmOrderCreated
  | DcmOrderFulfilled
  | DcmOrdersOrderLineAllocationRequested
  | DcmOrdersOrderConfirmed
  | DcmOrdersOrderCancelled
  | DcmOrdersOrderLineShipped
  | DcmOrdersOrderLineAllocationFailed
  | DcmReturnInitiated
  | DcmReturnsRmaRequested
  | DcmReturnsRmaApproved
  | DcmReturnsRmaRejected
  | DcmReturnReceived
  | DcmReturnsReturnRestocked
  | DcmReturnsReturnCredited;

export * from "./adapters.js";
export { createModuleRuntimeStore } from "@betterdata/scm-contracts";
