// Copyright (c) Better Data, Inc.
// SPDX-License-Identifier: Apache-2.0

import type {
  ScmInventoryStockReserved,
  ScmInventoryStockReturned,
  ScmInventoryStockUpdated
} from "@betterdata/scm-contracts";
import { getInventoryRuntime, inventoryDb } from "../runtime";

export interface AvailabilityQuery {
  organizationId: string;
  locationId?: string;
  productMasterId?: string;
  productId?: string;
  lotId?: string;
  binId?: string;
  includeExpired?: boolean;
  includeRecalled?: boolean;
  includeOnHold?: boolean;
}

export interface StockLineAvailability {
  inventoryItemId: string;
  productMasterId: string | null;
  productId: string | null;
  lotId: string | null;
  lotNumber: string | null;
  expiryDate: Date | null;
  binId: string | null;
  binCode: string | null;
  binType: string | null;
  locationId: string | null;
  locationName: string | null;
  qtyOnHand: number;
  qtyAvailable: number;
  qtyOnHold: number;
  qtyPicked: number;
  qtyRecalled: number;
  qtyExpired: number;
  isOnHold: boolean;
  isRecalled: boolean;
  isExpired: boolean;
  status: string;
}

export interface AvailabilityCheckParams {
  organizationId: string;
  locationId: string;
  productMasterId?: string;
  productId?: string;
  lotId?: string;
  binId?: string;
  quantityNeeded: number;
  respectFEFO?: boolean;
}

export interface AvailabilityCheckResult {
  available: boolean;
  totalAvailable: number;
  quantityNeeded: number;
  shortfall: number;
  suggestedAllocations: Array<{
    inventoryItemId: string;
    lotId: string | null;
    lotNumber: string | null;
    expiryDate: Date | null;
    binId: string | null;
    binCode: string | null;
    qtyToAllocate: number;
    qtyAvailable: number;
  }>;
}

type DbClient = Record<string, any>;
type ReturnCondition = ScmInventoryStockReturned["payload"]["condition"];
type TxClient = Record<string, unknown>;

type CursorCapableClient = TxClient & {
  moduleEventCursor: {
    findUnique: (args: {
      where: { module_channel_organizationId: { module: string; channel: string; organizationId: string } };
    }) => Promise<{ lastProcessedMessageId: string | null } | null>;
    upsert: (args: {
      where: { module_channel_organizationId: { module: string; channel: string; organizationId: string } };
      create: { module: string; channel: string; organizationId: string; lastProcessedMessageId: string | null };
      update: { lastProcessedMessageId: string | null };
    }) => Promise<unknown>;
  };
  outboxEntry: {
    findUnique: (args: { where: { id: string }; select: { eventType: true } }) => Promise<{ eventType: string } | null>;
  };
};

function db(): DbClient {
  return inventoryDb() as DbClient;
}

export class StockService {
  /**
   * Applies a QOH change and emits `scm.inventory.stock_updated.v1` in the same transaction.
   */
  static async applyQuantityOnHandChange(params: {
    organizationId: string;
    inventoryItemId: string;
    quantityChange: number;
    correlationId: string;
    causationId: string;
  }): Promise<{ quantityOnHand: number; eventType: "scm.inventory.stock_updated.v1" }> {
    const prisma = db();
    return prisma.$transaction(async (tx: TxClient & DbClient) => {
      const existing = await tx.inventoryItem.findFirst({
        where: { id: params.inventoryItemId, organizationId: params.organizationId },
        select: {
          id: true,
          organizationId: true
        }
      });
      if (!existing) {
        throw new Error("Inventory item not found");
      }
      const updated = await tx.inventoryItem.update({
        where: { id: params.inventoryItemId },
        data: { qtyOnHand: { increment: params.quantityChange } },
        select: {
          id: true,
          qtyOnHand: true,
          locationId: true,
          productMasterId: true,
          productId: true
        }
      });

      const payload: ScmInventoryStockUpdated["payload"] = {
        organizationId: params.organizationId,
        skuId: String(updated.productMasterId || updated.productId || "unknown"),
        locationId: String(updated.locationId || "unknown"),
        quantityOnHand: Number(updated.qtyOnHand || 0),
        quantityChange: params.quantityChange,
        correlationId: params.correlationId,
        causationId: params.causationId
      };

      await getInventoryRuntime().outbox.write(tx, {
        aggregateType: "scm.inventory",
        aggregateId: updated.id,
        eventType: "scm.inventory.stock_updated.v1",
        payload,
        organizationId: params.organizationId,
        correlationId: params.correlationId,
        causationId: params.causationId
      });

      return {
        quantityOnHand: Number(updated.qtyOnHand || 0),
        eventType: "scm.inventory.stock_updated.v1"
      };
    });
  }

  static async consumeReturnReceived(params: {
    organizationId: string;
    limit?: number;
  }): Promise<{ processed: number; lastProcessedMessageId: string | null }> {
    const prisma = db() as DbClient & CursorCapableClient;
    const moduleId = "scm.inventory.returns";
    const channel = "dcm-returns-events";
    const cursor = await prisma.moduleEventCursor.findUnique({
      where: {
        module_channel_organizationId: {
          module: moduleId,
          channel,
          organizationId: params.organizationId
        }
      }
    });
    const messages = await getInventoryRuntime().readChannelMessages(
      prisma,
      channel,
      cursor?.lastProcessedMessageId ?? undefined,
      params.limit ?? 50
    );

    let processed = 0;
    let lastProcessedMessageId: string | null = cursor?.lastProcessedMessageId ?? null;
    for (const message of messages) {
      if (message.organizationId !== params.organizationId) continue;
      const outbox = await prisma.outboxEntry.findUnique({
        where: { id: message.outboxEntryId },
        select: { eventType: true }
      });
      if (outbox?.eventType !== "dcm.returns.return_received.v1") continue;
      const payload = message.payload as any;
      await this.handleReturnReceived(prisma, {
        organizationId: params.organizationId,
        rmaId: payload.rmaId ?? payload.returnId,
        returnLineId: payload.returnLineId,
        skuId: payload.skuId,
        locationId: payload.locationId,
        quantityReturned: Number(payload.quantityReturned || 0),
        condition: payload.condition,
        correlationId: payload.correlationId,
        causationId: payload.causationId
      });
      processed += 1;
      lastProcessedMessageId = message.id;
    }

    await prisma.moduleEventCursor.upsert({
      where: {
        module_channel_organizationId: {
          module: moduleId,
          channel,
          organizationId: params.organizationId
        }
      },
      create: {
        module: moduleId,
        channel,
        organizationId: params.organizationId,
        lastProcessedMessageId
      },
      update: { lastProcessedMessageId }
    });

    return { processed, lastProcessedMessageId };
  }

  private static async handleReturnReceived(
    prisma: DbClient & TxClient,
    params: {
      organizationId: string;
      rmaId: string;
      returnLineId: string;
      skuId: string;
      locationId: string;
      quantityReturned: number;
      condition: ReturnCondition;
      correlationId: string;
      causationId: string;
    }
  ): Promise<void> {
    await prisma.$transaction(async (tx: DbClient & TxClient) => {
      const inventoryItem = await tx.inventoryItem.findFirst({
        where: {
          organizationId: params.organizationId,
          locationId: params.locationId,
          OR: [{ productMasterId: params.skuId }, { productId: params.skuId }]
        },
        select: { id: true, qtyOnHand: true, productMasterId: true, productId: true, locationId: true }
      });
      if (!inventoryItem) {
        return;
      }

      const stockReturnedPayload: ScmInventoryStockReturned["payload"] = {
        organizationId: params.organizationId,
        skuId: params.skuId,
        locationId: params.locationId,
        quantityReturned: params.quantityReturned,
        rmaId: params.rmaId,
        condition: params.condition,
        correlationId: params.correlationId,
        causationId: params.causationId
      };
      await getInventoryRuntime().outbox.write(tx, {
        aggregateType: "scm.inventory",
        aggregateId: inventoryItem.id,
        eventType: "scm.inventory.stock_returned.v1",
        payload: stockReturnedPayload,
        organizationId: params.organizationId,
        correlationId: params.correlationId,
        causationId: params.causationId
      });

      if (params.condition === "RESELLABLE") {
        const updated = await tx.inventoryItem.update({
          where: { id: inventoryItem.id },
          data: {
            qtyOnHand: { increment: params.quantityReturned },
            qtyAvailable: { increment: params.quantityReturned }
          },
          select: { qtyOnHand: true }
        });
        const updatedPayload: ScmInventoryStockUpdated["payload"] = {
          organizationId: params.organizationId,
          skuId: params.skuId,
          locationId: params.locationId,
          quantityOnHand: Number(updated.qtyOnHand || 0),
          quantityChange: params.quantityReturned,
          correlationId: params.correlationId,
          causationId: params.causationId
        };
        await getInventoryRuntime().outbox.write(tx, {
          aggregateType: "scm.inventory",
          aggregateId: inventoryItem.id,
          eventType: "scm.inventory.stock_updated.v1",
          payload: updatedPayload,
          organizationId: params.organizationId,
          correlationId: params.correlationId,
          causationId: params.causationId
        });
      } else if (params.condition === "DAMAGED") {
        const reservedPayload: ScmInventoryStockReserved["payload"] = {
          organizationId: params.organizationId,
          skuId: params.skuId,
          locationId: params.locationId,
          quantityReserved: params.quantityReturned,
          reservationId: `quarantine-${params.rmaId}-${params.returnLineId}`,
          reservationType: "QUARANTINE",
          orderId: `rma-${params.rmaId}`,
          orderLineId: params.returnLineId,
          correlationId: params.correlationId,
          causationId: params.causationId
        };
        await getInventoryRuntime().outbox.write(tx, {
          aggregateType: "scm.inventory",
          aggregateId: inventoryItem.id,
          eventType: "scm.inventory.stock_reserved.v1",
          payload: reservedPayload,
          organizationId: params.organizationId,
          correlationId: params.correlationId,
          causationId: params.causationId
        });
      } else {
        const updatedPayload: ScmInventoryStockUpdated["payload"] = {
          organizationId: params.organizationId,
          skuId: params.skuId,
          locationId: params.locationId,
          quantityOnHand: Number(inventoryItem.qtyOnHand || 0),
          quantityChange: 0,
          writeOff: true,
          correlationId: params.correlationId,
          causationId: params.causationId
        };
        await getInventoryRuntime().outbox.write(tx, {
          aggregateType: "scm.inventory",
          aggregateId: inventoryItem.id,
          eventType: "scm.inventory.stock_updated.v1",
          payload: updatedPayload,
          organizationId: params.organizationId,
          correlationId: params.correlationId,
          causationId: params.causationId
        });
      }
    });
  }

  static async getAvailability(query: AvailabilityQuery): Promise<StockLineAvailability[]> {
    const whereClause = this.buildWhereClause(query);
    const prisma = db();
    const items = await prisma.inventoryItem.findMany({
      where: whereClause,
      include: {
        lot: { select: { id: true, lotNumber: true, expiryDate: true, isRecalled: true } },
        bin: { select: { id: true, code: true, type: true } },
        location: { select: { id: true, name: true } }
      },
      orderBy: [{ locationId: "asc" }, { lot: { expiryDate: "asc" } }, { bin: { code: "asc" } }]
    });

    const results: StockLineAvailability[] = [];
    for (const item of items) {
      results.push(await this.calculateStockLineAvailability(item, query.organizationId));
    }
    return results;
  }

  static async checkAvailability(params: AvailabilityCheckParams): Promise<AvailabilityCheckResult> {
    const stockLines = await this.getAvailability({
      organizationId: params.organizationId,
      locationId: params.locationId,
      productMasterId: params.productMasterId,
      productId: params.productId,
      lotId: params.lotId,
      binId: params.binId,
      includeExpired: false,
      includeRecalled: false,
      includeOnHold: false
    });

    const availableLines = stockLines.filter(
      (line) => line.qtyAvailable > 0 && !line.isOnHold && !line.isRecalled && !line.isExpired
    );

    if (params.respectFEFO) {
      availableLines.sort((a, b) => {
        if (!a.expiryDate && !b.expiryDate) return 0;
        if (!a.expiryDate) return 1;
        if (!b.expiryDate) return -1;
        return a.expiryDate.getTime() - b.expiryDate.getTime();
      });
    }

    const totalAvailable = availableLines.reduce((sum, line) => sum + line.qtyAvailable, 0);
    const available = totalAvailable >= params.quantityNeeded;
    const shortfall = Math.max(0, params.quantityNeeded - totalAvailable);

    const suggestedAllocations: AvailabilityCheckResult["suggestedAllocations"] = [];
    let remainingQty = params.quantityNeeded;
    for (const line of availableLines) {
      if (remainingQty <= 0) break;
      const qtyToAllocate = Math.min(remainingQty, line.qtyAvailable);
      suggestedAllocations.push({
        inventoryItemId: line.inventoryItemId,
        lotId: line.lotId,
        lotNumber: line.lotNumber,
        expiryDate: line.expiryDate,
        binId: line.binId,
        binCode: line.binCode,
        qtyToAllocate,
        qtyAvailable: line.qtyAvailable
      });
      remainingQty -= qtyToAllocate;
    }

    return { available, totalAvailable, quantityNeeded: params.quantityNeeded, shortfall, suggestedAllocations };
  }

  static async recomputeAvailability(
    inventoryItemId: string,
    organizationId: string
  ): Promise<StockLineAvailability | null> {
    const prisma = db();
    const item = await prisma.inventoryItem.findFirst({
      where: { id: inventoryItemId, organizationId },
      include: { lot: true, bin: true, location: true, productMaster: true, product: true }
    });
    if (!item) return null;
    const availability = await this.calculateStockLineAvailability(item, organizationId);
    await prisma.inventoryItem.update({
      where: { id: inventoryItemId },
      data: { qtyAvailable: availability.qtyAvailable, isOnHold: availability.isOnHold }
    });
    return availability;
  }

  private static buildWhereClause(query: AvailabilityQuery): Record<string, unknown> {
    const where: Record<string, unknown> = { organizationId: query.organizationId };
    if (query.locationId) where.locationId = query.locationId;
    if (query.productMasterId) where.productMasterId = query.productMasterId;
    else if (query.productId) where.productId = query.productId;
    if (query.lotId) where.lotId = query.lotId;
    if (query.binId) where.binId = query.binId;
    if (!query.includeRecalled) where.OR = [{ lot: null }, { lot: { isRecalled: false } }];
    if (!query.includeOnHold) where.isOnHold = false;
    return where;
  }

  private static async calculateStockLineAvailability(
    item: Record<string, any>,
    organizationId: string
  ): Promise<StockLineAvailability> {
    const qtyOnHand = Number(item.qtyOnHand || 0);
    const isRecalled = Boolean(item.lot?.isRecalled);
    const isOnHold = Boolean(item.isOnHold || item.bin?.type === "HOLD");
    const isExpired = item.lot?.expiryDate ? new Date(item.lot.expiryDate) < new Date() : false;

    let status = item.status || "AVAILABLE";
    if (isRecalled) status = "RECALLED";
    else if (isOnHold) status = "ON_HOLD";
    else if (isExpired) status = "EXPIRED";

    const qtyPicked = await this.calculatePickedQuantity(item.id, organizationId);
    const qtyOnHold = isOnHold ? qtyOnHand : 0;
    const qtyRecalled = isRecalled ? qtyOnHand : 0;
    const qtyExpired = isExpired ? qtyOnHand : 0;
    let qtyAvailable = Math.max(0, qtyOnHand - qtyPicked);
    if (isOnHold || isRecalled || isExpired) qtyAvailable = 0;

    return {
      inventoryItemId: item.id,
      productMasterId: item.productMasterId || null,
      productId: item.productId || null,
      lotId: item.lotId || null,
      lotNumber: item.lot?.lotNumber || null,
      expiryDate: item.lot?.expiryDate || null,
      binId: item.binId || null,
      binCode: item.bin?.code || null,
      binType: item.bin?.type || null,
      locationId: item.locationId || null,
      locationName: item.location?.name || null,
      qtyOnHand,
      qtyAvailable,
      qtyOnHold,
      qtyPicked,
      qtyRecalled,
      qtyExpired,
      isOnHold,
      isRecalled,
      isExpired,
      status
    };
  }

  private static async calculatePickedQuantity(
    inventoryItemId: string,
    organizationId: string
  ): Promise<number> {
    const prisma = db();
    const allocations = await prisma.shipmentAllocation.findMany({
      where: {
        organizationId,
        inventoryItemId,
        shipmentItem: {
          shipment: {
            currentStatus: { in: ["PENDING", "PICKING", "PICKED", "CHECKING", "ISSUED", "SHIPPED"] }
          }
        }
      },
      select: { qty: true }
    });
    const allocationQty = allocations.reduce((total: number, alloc: Record<string, any>) => total + Number(alloc.qty || 0), 0);

    const picklistItems = await prisma.picklistItem.findMany({
      where: {
        organizationId,
        inventoryItemId,
        status: { in: ["PENDING", "IN_PROGRESS", "PARTIALLY_PICKED"] }
      },
      select: { quantity: true }
    });
    const picklistQty = picklistItems.reduce(
      (total: number, pickItem: Record<string, any>) => total + Number(pickItem.quantity || 0),
      0
    );
    return allocationQty + picklistQty;
  }
}

export const getAvailability = StockService.getAvailability.bind(StockService);
export const checkAvailability = StockService.checkAvailability.bind(StockService);
export const recomputeAvailability = StockService.recomputeAvailability.bind(StockService);
export const consumeReturnReceived = StockService.consumeReturnReceived.bind(StockService);
