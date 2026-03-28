// Copyright (c) Better Data, Inc.
// SPDX-License-Identifier: Apache-2.0

import type { DcmReturnsReturnCredited } from "@betterdata/dcm-contracts";
import { writeOutboxEntry, type PrismaTransactionClient } from "@betterdata/shared-event-bus";
import type { CreditIssuanceAdapter } from "../adapters/credit-issuance.adapter";

type DbClient = Record<string, any>;

export class ReturnCreditService {
  static async issueCredit(params: {
    prisma: DbClient & PrismaTransactionClient;
    organizationId: string;
    rmaId: string;
    returnLineId: string;
    amountCredited: number;
    currencyCode: string;
    correlationId: string;
    causationId?: string;
    adapter?: CreditIssuanceAdapter;
  }): Promise<{ creditMemoId: string }> {
    return params.prisma.$transaction(async (tx: DbClient & PrismaTransactionClient) => {
      const issueResult = params.adapter
        ? await params.adapter.issueCredit({
            organizationId: params.organizationId,
            rmaId: params.rmaId,
            returnLineId: params.returnLineId,
            amount: params.amountCredited,
            currencyCode: params.currencyCode,
            correlationId: params.correlationId
          })
        : { creditMemoId: `credit-${params.returnLineId}`, issuedAt: new Date().toISOString() };

      await tx.returnLine.update({
        where: { id: params.returnLineId },
        data: {
          state: "CREDITED",
          creditedAt: new Date()
        }
      });

      const event: DcmReturnsReturnCredited = {
        eventId: crypto.randomUUID(),
        eventType: "dcm.returns.return_credited.v1",
        occurredAt: new Date().toISOString(),
        correlationId: params.correlationId,
        causationId: params.causationId,
        schemaVersion: "1",
        payload: {
          organizationId: params.organizationId,
          rmaId: params.rmaId,
          creditMemoId: issueResult.creditMemoId,
          amountCredited: params.amountCredited,
          currencyCode: params.currencyCode,
          creditedAt: issueResult.issuedAt,
          correlationId: params.correlationId,
          causationId: params.causationId ?? params.correlationId
        }
      };
      await writeOutboxEntry(tx, {
        aggregateType: "dcm.returns",
        aggregateId: params.returnLineId,
        eventType: event.eventType,
        payload: event.payload,
        organizationId: params.organizationId,
        correlationId: event.correlationId,
        causationId: event.causationId ?? event.eventId
      });
      return { creditMemoId: issueResult.creditMemoId };
    });
  }
}
