// Copyright (c) Better Data, Inc.
// SPDX-License-Identifier: Apache-2.0

import { RmaStateMachineService } from "./rma-state-machine.service";
import type { DcmReturnReceived } from "@betterdata/dcm-contracts";

type DbClient = Record<string, any>;
type ReturnCondition = DcmReturnReceived["payload"]["condition"];

export class ReturnReceiptService {
  static async processPhysicalReceipt(params: {
    prisma: DbClient;
    organizationId: string;
    rmaId: string;
    locationId: string;
    correlationId: string;
    causationId?: string;
    lines: Array<{
      returnLineId: string;
      condition: ReturnCondition;
    }>;
  }): Promise<void> {
    for (const line of params.lines) {
      await RmaStateMachineService.registerReturnLineReceipt({
        prisma: params.prisma,
        organizationId: params.organizationId,
        rmaId: params.rmaId,
        returnLineId: line.returnLineId,
        locationId: params.locationId,
        condition: line.condition,
        correlationId: params.correlationId,
        causationId: params.causationId
      });
    }
  }
}
