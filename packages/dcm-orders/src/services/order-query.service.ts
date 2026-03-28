// Copyright (c) Better Data, Inc.
// SPDX-License-Identifier: Apache-2.0

type DcmOrdersDbClient = Record<string, any>;

export class OrderQueryService {
  static async getOrder(
    prisma: DcmOrdersDbClient,
    organizationId: string,
    orderId: string
  ): Promise<Record<string, unknown> | null> {
    return (prisma as any).dcmOrder.findFirst({
      where: { id: orderId, organizationId },
      include: {
        lines: true
      }
    });
  }

  static async getOpenOrders(
    prisma: DcmOrdersDbClient,
    organizationId: string
  ): Promise<Array<Record<string, unknown>>> {
    return (prisma as any).dcmOrder.findMany({
      where: {
        organizationId,
        state: { in: ["DRAFT", "CONFIRMED", "ALLOCATION_PENDING", "ALLOCATED"] }
      },
      include: { lines: true },
      orderBy: { createdAt: "desc" },
      take: 200
    });
  }

  static async getPendingAllocations(
    prisma: DcmOrdersDbClient,
    organizationId: string
  ): Promise<Array<Record<string, unknown>>> {
    return (prisma as any).dcmOrderLine.findMany({
      where: {
        organizationId,
        state: { in: ["ALLOCATION_PENDING"] }
      },
      orderBy: { id: "asc" },
      take: 200
    });
  }

  static async getAllocationFailures(
    prisma: DcmOrdersDbClient,
    organizationId: string
  ): Promise<Array<Record<string, unknown>>> {
    return (prisma as any).dcmOrderLine.findMany({
      where: {
        organizationId,
        state: "ALLOCATION_FAILED"
      },
      orderBy: { id: "asc" },
      take: 200
    });
  }
}
