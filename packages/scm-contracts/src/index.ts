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

export type ScmModuleId =
  | "scm.inventory"
  | "scm.catalog"
  | "scm.procurement"
  | "scm.execution";

export interface InternalBootstrapRequest {
  organizationId: string;
  moduleId: ScmModuleId;
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
  moduleId: ScmModuleId;
  correlationId: string;
  fromVersion?: string;
}

export interface InternalBackfillResponse {
  ok: boolean;
  recordsProcessed: number;
  warning?: string;
}

export interface InternalHealthRequest {
  moduleId: ScmModuleId;
  organizationId: string;
}

export interface InternalHealthResponse {
  moduleId: ScmModuleId;
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

export type ScmInventoryAdjusted = EventEnvelope<
  "scm.inventory.adjusted.v1",
  {
    organizationId: string;
    sku: string;
    locationId: string;
    delta: number;
    reason: string;
  }
>;

export type ScmInventoryAllocated = EventEnvelope<
  "scm.inventory.allocated.v1",
  {
    organizationId: string;
    sku: string;
    locationId: string;
    quantity: number;
    allocationRef: string;
  }
>;

export type ScmInventoryStockUpdated = EventEnvelope<
  "scm.inventory.stock_updated.v1",
  {
    organizationId: string;
    skuId: string;
    locationId: string;
    quantityOnHand: number;
    quantityChange: number;
    writeOff?: boolean;
    correlationId: string;
    causationId: string;
  }
>;

export type ScmInventoryStockReserved = EventEnvelope<
  "scm.inventory.stock_reserved.v1",
  {
    organizationId: string;
    skuId: string;
    locationId: string;
    quantityReserved: number;
    reservationId: string;
    reservationType: "CUSTOMER_ORDER" | "QUARANTINE";
    orderId: string;
    orderLineId: string;
    correlationId: string;
    causationId: string;
  }
>;

export type ScmInventoryStockReservationFailed = EventEnvelope<
  "scm.inventory.stock_reservation_failed.v1",
  {
    organizationId: string;
    skuId: string;
    locationId: string;
    quantityRequested: number;
    quantityAvailable: number;
    orderId: string;
    orderLineId: string;
    correlationId: string;
    causationId: string;
  }
>;

export type ScmInventoryStockReturned = EventEnvelope<
  "scm.inventory.stock_returned.v1",
  {
    organizationId: string;
    skuId: string;
    locationId: string;
    quantityReturned: number;
    rmaId: string;
    condition: "RESELLABLE" | "DAMAGED" | "DESTROYED";
    correlationId: string;
    causationId: string;
  }
>;

export type ScmCatalogProductPublished = EventEnvelope<
  "scm.catalog.product_published.v1",
  {
    organizationId: string;
    productId: string;
    sku: string;
    title: string;
    status: "draft" | "active";
  }
>;

export type ScmCatalogProductArchived = EventEnvelope<
  "scm.catalog.product_archived.v1",
  {
    organizationId: string;
    productId: string;
    sku: string;
    reason?: string;
  }
>;

export type ScmProcurementPoCreated = EventEnvelope<
  "scm.procurement.po_created.v1",
  {
    organizationId: string;
    purchaseOrderId: string;
    supplierId: string;
    lineCount: number;
  }
>;

export type ScmProcurementPoConfirmed = EventEnvelope<
  "scm.procurement.po_confirmed.v1",
  {
    organizationId: string;
    purchaseOrderId: string;
    confirmedAt: string;
    confirmedBy: string;
  }
>;

export type ScmProcurementPoAmended = EventEnvelope<
  "scm.procurement.po_amended.v1",
  {
    organizationId: string;
    purchaseOrderId: string;
    amendedAt: string;
    amendedBy: string;
    amendedFields: string[];
  }
>;

export type ScmProcurementPoCancelled = EventEnvelope<
  "scm.procurement.po_cancelled.v1",
  {
    organizationId: string;
    purchaseOrderId: string;
    reason: string;
  }
>;

export type ScmExecutionGoodsReceived = EventEnvelope<
  "scm.execution.goods_received.v1",
  {
    organizationId: string;
    receiptId: string;
    purchaseOrderId?: string;
    receivedAt: string;
  }
>;

export type ScmExecutionReceiptScheduled = EventEnvelope<
  "scm.execution.receipt_scheduled.v1",
  {
    organizationId: string;
    shipmentId: string;
    purchaseOrderId?: string;
    scheduledAt: string;
    destinationLocationId: string;
  }
>;

export type ScmExecutionShipmentPicked = EventEnvelope<
  "scm.execution.shipment_picked.v1",
  {
    organizationId: string;
    shipmentId: string;
    pickedAt: string;
    pickedBy: string;
  }
>;

export type ScmExecutionShipmentPacked = EventEnvelope<
  "scm.execution.shipment_packed.v1",
  {
    organizationId: string;
    shipmentId: string;
    packedAt: string;
    packedBy: string;
  }
>;

export type ScmExecutionShipmentShipped = EventEnvelope<
  "scm.execution.shipment_shipped.v1",
  {
    organizationId: string;
    shipmentId: string;
    shippedAt: string;
    carrierCode?: string;
  }
>;

export type ScmProcurementInvoiceMatchTriggered = EventEnvelope<
  "scm.procurement.invoice_match_triggered.v1",
  {
    organizationId: string;
    invoiceId: string;
    purchaseOrderId: string;
    triggeredBy: string;
  }
>;

export type ScmExecutionPickCompleted = EventEnvelope<
  "scm.execution.pick_completed.v1",
  {
    organizationId: string;
    taskId: string;
    locationId: string;
    pickedQuantity: number;
  }
>;

export type ScmExecutionShipmentDispatched = EventEnvelope<
  "scm.execution.shipment_dispatched.v1",
  {
    organizationId: string;
    shipmentId: string;
    carrierCode?: string;
    dispatchedAt: string;
  }
>;

export type ScmEvent =
  | ScmInventoryAdjusted
  | ScmInventoryAllocated
  | ScmInventoryStockUpdated
  | ScmInventoryStockReserved
  | ScmInventoryStockReservationFailed
  | ScmInventoryStockReturned
  | ScmCatalogProductPublished
  | ScmCatalogProductArchived
  | ScmProcurementPoCreated
  | ScmProcurementPoConfirmed
  | ScmProcurementPoAmended
  | ScmProcurementPoCancelled
  | ScmProcurementInvoiceMatchTriggered
  | ScmExecutionReceiptScheduled
  | ScmExecutionShipmentPicked
  | ScmExecutionShipmentPacked
  | ScmExecutionShipmentShipped
  | ScmExecutionGoodsReceived
  | ScmExecutionPickCompleted
  | ScmExecutionShipmentDispatched;
