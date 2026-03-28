// Copyright (c) Better Data, Inc.
// SPDX-License-Identifier: Apache-2.0

type ProcurementDbClient = Record<string, any>;

export type ProcurementPreloadContribution = {
  openPurchaseOrders: Array<Record<string, unknown>>;
  pendingReceipts: Array<Record<string, unknown>>;
  supplierCatalog: Array<Record<string, unknown>>;
};

export interface ProcurementPreloadAdapter {
  getOpenPurchaseOrders?: (organizationId: string) => Promise<Array<Record<string, unknown>>>;
  getPendingReceipts?: (organizationId: string) => Promise<Array<Record<string, unknown>>>;
  getSupplierCatalog?: (organizationId: string) => Promise<Array<Record<string, unknown>>>;
}

export async function preloadContribution(
  organizationId: string,
  prisma?: ProcurementDbClient,
  adapter?: ProcurementPreloadAdapter
): Promise<ProcurementPreloadContribution> {
  if (adapter) {
    return {
      openPurchaseOrders: adapter.getOpenPurchaseOrders
        ? await adapter.getOpenPurchaseOrders(organizationId)
        : [],
      pendingReceipts: adapter.getPendingReceipts
        ? await adapter.getPendingReceipts(organizationId)
        : [],
      supplierCatalog: adapter.getSupplierCatalog
        ? await adapter.getSupplierCatalog(organizationId)
        : []
    };
  }
  if (!prisma) {
    return { openPurchaseOrders: [], pendingReceipts: [], supplierCatalog: [] };
  }
  const purchaseOrderModel =
    prisma.purchaseOrder ??
    prisma.purchaseOrders ??
    prisma.order;
  const goodsReceiptModel =
    prisma.goodsReceipt ??
    prisma.receipt ??
    prisma.receipts;
  const supplierModel =
    prisma.supplier ??
    prisma.suppliers;

  const [openPurchaseOrders, pendingReceipts, supplierCatalog] = await Promise.all([
    purchaseOrderModel?.findMany
      ? purchaseOrderModel.findMany({
      where: { organizationId },
      select: {
        id: true,
        number: true,
        status: true,
        supplierId: true,
        createdAt: true,
        expectedAt: true
      },
      take: 200,
      orderBy: { createdAt: "desc" }
    }).catch(() => [])
      : Promise.resolve([]),
    goodsReceiptModel?.findMany
      ? goodsReceiptModel.findMany({
      where: { organizationId, status: { in: ["DRAFT", "PENDING", "PARTIAL"] } },
      select: {
        id: true,
        receiptNumber: true,
        purchaseOrderId: true,
        status: true,
        createdAt: true
      },
      take: 200,
      orderBy: { createdAt: "desc" }
    }).catch(() => [])
      : Promise.resolve([]),
    supplierModel?.findMany
      ? supplierModel.findMany({
      where: { organizationId, isActive: true },
      select: { id: true, supplierCode: true, name: true },
      take: 200,
      orderBy: { name: "asc" }
    }).catch(() => [])
      : Promise.resolve([])
  ]);
  return { openPurchaseOrders, pendingReceipts, supplierCatalog };
}
