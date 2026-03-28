// Copyright (c) Better Data, Inc.
// SPDX-License-Identifier: Apache-2.0

type ReturnsDbClient = Record<string, any>;

export type ReturnsPreloadContribution = {
  openRmaRequests: Array<Record<string, unknown>>;
  pendingReceipts: Array<Record<string, unknown>>;
  pendingCredits: Array<Record<string, unknown>>;
};

export async function preloadContribution(
  organizationId: string,
  prisma?: ReturnsDbClient
): Promise<ReturnsPreloadContribution> {
  if (!prisma) {
    return { openRmaRequests: [], pendingReceipts: [], pendingCredits: [] };
  }
  const [openRmaRequests, pendingReceipts, pendingCredits] = await Promise.all([
    prisma.rmaRequest.findMany({
      where: {
        organizationId,
        state: {
          in: ["REQUESTED", "APPROVED", "PARTIALLY_RECEIVED", "FULLY_RECEIVED"]
        }
      },
      orderBy: { requestedAt: "desc" },
      take: 200
    }),
    prisma.returnLine.findMany({
      where: {
        rma: { organizationId },
        state: "PENDING"
      },
      orderBy: { id: "asc" },
      take: 200
    }),
    prisma.returnLine.findMany({
      where: {
        rma: { organizationId },
        state: { in: ["RESTOCKED", "DAMAGED_HOLD", "DESTROYED"] }
      },
      orderBy: { id: "asc" },
      take: 200
    })
  ]);

  return {
    openRmaRequests,
    pendingReceipts,
    pendingCredits
  };
}
