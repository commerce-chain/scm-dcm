// Copyright (c) Better Data, Inc.
// SPDX-License-Identifier: Apache-2.0

import type { SharedDbClient } from "@betterdata/shared-db";
import type {
  ScmInventoryStockReserved,
  ScmInventoryStockReservationFailed
} from "@betterdata/scm-contracts";
import { writeOutboxEntry, type PrismaTransactionClient } from "@betterdata/shared-event-bus";

export interface SoftReserveRequest {
  organizationId: string;
  channelId: string;
  locationId: string;
  productMasterId: string;
  quantity: number;
  idempotencyKey?: string;
  externalRef?: string;
  externalRefType?: string;
  priority?: number;
  ttlSeconds?: number;
  metadata?: Record<string, unknown>;
  userId?: string;
  orderId?: string;
  orderLineId?: string;
  correlationId?: string;
  causationId?: string;
}

export interface SoftReserveResponse {
  success: boolean;
  reservationId?: string;
  expiresAt?: Date;
  atpBefore?: number;
  atpAfter?: number;
  surgeMode?: boolean;
  error?: string;
  errorCode?: ReservationErrorCode;
}

export enum ReservationErrorCode {
  INSUFFICIENT_ATP = "INSUFFICIENT_ATP",
  DUPLICATE_IDEMPOTENCY_KEY = "DUPLICATE_IDEMPOTENCY_KEY",
  SURGE_MODE_REJECTED = "SURGE_MODE_REJECTED",
  CONCURRENCY_CONFLICT = "CONCURRENCY_CONFLICT",
  RESERVATION_NOT_FOUND = "RESERVATION_NOT_FOUND",
  RESERVATION_EXPIRED = "RESERVATION_EXPIRED",
  RESERVATION_ALREADY_CONVERTED = "RESERVATION_ALREADY_CONVERTED",
  INVALID_QUANTITY = "INVALID_QUANTITY",
  INTERNAL_ERROR = "INTERNAL_ERROR"
}

export interface ConvertToHardRequest {
  reservationId: string;
  organizationId: string;
  shipmentItemId: string;
  lotId?: string;
  binId?: string;
  userId?: string;
}

export interface ConvertToHardResponse {
  success: boolean;
  allocationId?: string;
  error?: string;
  errorCode?: ReservationErrorCode;
}

export interface ReleaseRequest {
  reservationId: string;
  organizationId: string;
  reason: string;
  userId?: string;
}

export interface ReleaseResponse {
  success: boolean;
  atpRestored?: number;
  error?: string;
  errorCode?: ReservationErrorCode;
}

export interface BulkReleaseRequest {
  organizationId: string;
  externalRef?: string;
  externalRefType?: string;
  channelId?: string;
  expiredOnly?: boolean;
  reason: string;
  userId?: string;
}

export interface BulkReleaseResponse {
  success: boolean;
  releasedCount: number;
  atpRestored: number;
  errors?: string[];
}

export type SoftReservationStatus =
  | "PENDING"
  | "CONFIRMED"
  | "CONVERTING"
  | "CONVERTED"
  | "CANCELLED"
  | "EXPIRED"
  | "FAILED";

const STUB_ERROR = new Error(
  "ReservationService is stubbed due to schema drift. Required models: SoftReservation, ReservationAuditLog, AtpConfiguration"
);

export class ReservationService {
  static async createSoftReservation(
    db: SharedDbClient,
    request: SoftReserveRequest
  ): Promise<SoftReserveResponse> {
    if (request.quantity <= 0) {
      return {
        success: false,
        error: "Quantity must be positive",
        errorCode: ReservationErrorCode.INVALID_QUANTITY
      };
    }

    const reservationId = `res_${Date.now()}_${Math.random().toString(16).slice(2, 8)}`;
    const correlationId = request.correlationId ?? request.idempotencyKey ?? reservationId;
    const causationId = request.causationId ?? "reservation_attempt";
    const txDb = db as SharedDbClient & {
      $transaction: <T>(fn: (tx: SharedDbClient & PrismaTransactionClient & Record<string, any>) => Promise<T>) => Promise<T>;
    };

    return txDb.$transaction(async (tx) => {
      const inventoryItem = await (tx as any).inventoryItem.findFirst({
        where: {
          organizationId: request.organizationId,
          locationId: request.locationId,
          productMasterId: request.productMasterId
        },
        select: { id: true, qtyAvailable: true }
      });

      const availableQty = Number(inventoryItem?.qtyAvailable ?? 0);
      if (!inventoryItem || availableQty < request.quantity) {
        const failedPayload: ScmInventoryStockReservationFailed["payload"] = {
          organizationId: request.organizationId,
          skuId: request.productMasterId,
          locationId: request.locationId,
          quantityRequested: request.quantity,
          quantityAvailable: availableQty,
          orderId: request.orderId ?? "unknown-order",
          orderLineId: request.orderLineId ?? "unknown-order-line",
          correlationId,
          causationId
        };
        await writeOutboxEntry(tx, {
          aggregateType: "scm.inventory",
          aggregateId: request.productMasterId,
          eventType: "scm.inventory.stock_reservation_failed.v1",
          payload: failedPayload,
          organizationId: request.organizationId,
          correlationId,
          causationId
        });
        return {
          success: false,
          error: "Insufficient ATP",
          errorCode: ReservationErrorCode.INSUFFICIENT_ATP,
          atpBefore: availableQty,
          atpAfter: availableQty
        };
      }

      await (tx as any).inventoryItem.update({
        where: { id: inventoryItem.id },
        data: { qtyAvailable: { decrement: request.quantity } }
      });

      const reservedPayload: ScmInventoryStockReserved["payload"] = {
        organizationId: request.organizationId,
        skuId: request.productMasterId,
        locationId: request.locationId,
        quantityReserved: request.quantity,
        reservationId,
        reservationType: "CUSTOMER_ORDER",
        orderId: request.orderId ?? "unknown-order",
        orderLineId: request.orderLineId ?? "unknown-order-line",
        correlationId,
        causationId
      };
      await writeOutboxEntry(tx, {
        aggregateType: "scm.inventory",
        aggregateId: request.productMasterId,
        eventType: "scm.inventory.stock_reserved.v1",
        payload: reservedPayload,
        organizationId: request.organizationId,
        correlationId,
        causationId
      });

      return {
        success: true,
        reservationId,
        atpBefore: availableQty,
        atpAfter: availableQty - request.quantity
      };
    });
  }

  static async confirmSoftReservation(
    _db: SharedDbClient,
    _reservationId: string,
    _organizationId: string,
    _userId?: string
  ): Promise<{ success: boolean; error?: string }> {
    throw STUB_ERROR;
  }

  static async convertToHardReservation(
    _db: SharedDbClient,
    _request: ConvertToHardRequest
  ): Promise<ConvertToHardResponse> {
    throw STUB_ERROR;
  }

  static async releaseSoftReservation(
    _db: SharedDbClient,
    _request: ReleaseRequest
  ): Promise<ReleaseResponse> {
    throw STUB_ERROR;
  }

  static async releaseExpiredReservations(
    _db: SharedDbClient,
    _organizationId: string
  ): Promise<BulkReleaseResponse> {
    throw STUB_ERROR;
  }

  static async bulkRelease(
    _db: SharedDbClient,
    _request: BulkReleaseRequest
  ): Promise<BulkReleaseResponse> {
    throw STUB_ERROR;
  }

  static async getReservation(
    _db: SharedDbClient,
    _reservationId: string,
    _organizationId: string
  ): Promise<{
    id: string;
    status: SoftReservationStatus;
    quantity: number;
    expiresAt: Date;
    productMasterId: string;
    locationId: string;
    channelId: string;
    externalRef?: string;
    isExpired: boolean;
    createdAt: Date;
  } | null> {
    throw STUB_ERROR;
  }

  static async getActiveReservations(
    _db: SharedDbClient,
    _organizationId: string,
    _productMasterId: string,
    _locationId: string
  ): Promise<
    Array<{
      id: string;
      quantity: number;
      expiresAt: Date;
      channelId: string;
      externalRef?: string;
      priority: number;
    }>
  > {
    throw STUB_ERROR;
  }
}

export const createSoftReservation = ReservationService.createSoftReservation.bind(ReservationService);
export const confirmSoftReservation = ReservationService.confirmSoftReservation.bind(ReservationService);
export const convertToHardReservation = ReservationService.convertToHardReservation.bind(ReservationService);
export const releaseSoftReservation = ReservationService.releaseSoftReservation.bind(ReservationService);
export const releaseExpiredReservations = ReservationService.releaseExpiredReservations.bind(ReservationService);
export const bulkReleaseReservations = ReservationService.bulkRelease.bind(ReservationService);
export const getReservation = ReservationService.getReservation.bind(ReservationService);
export const getActiveReservations = ReservationService.getActiveReservations.bind(ReservationService);
