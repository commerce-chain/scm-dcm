// Copyright (c) Better Data, Inc.
// SPDX-License-Identifier: Apache-2.0

import type { ModuleDb } from "@betterdata/scm-contracts";

export type { OutboxWriteInput, OutboxWriter, ModuleDb } from "@betterdata/scm-contracts";

/** DCM orders module — Prisma delegates (structural typing; real client is wider). */
export interface OrdersDb extends ModuleDb {
  dcmOrder: {
    findFirst: (...args: unknown[]) => Promise<unknown>;
    findUnique: (...args: unknown[]) => Promise<unknown>;
    findMany: (...args: unknown[]) => Promise<unknown[]>;
    create: (...args: unknown[]) => Promise<unknown>;
    update: (...args: unknown[]) => Promise<unknown>;
  };
  dcmOrderLine: {
    findFirst: (...args: unknown[]) => Promise<unknown>;
    findMany: (...args: unknown[]) => Promise<unknown[]>;
    create: (...args: unknown[]) => Promise<unknown>;
    update: (...args: unknown[]) => Promise<unknown>;
  };
}

/** DCM returns module — Prisma delegates (structural typing; real client is wider). */
export interface ReturnsDb extends ModuleDb {
  rmaRequest: {
    findFirst: (...args: unknown[]) => Promise<unknown>;
    findMany: (...args: unknown[]) => Promise<unknown[]>;
    create: (...args: unknown[]) => Promise<unknown>;
    update: (...args: unknown[]) => Promise<unknown>;
  };
  returnLine: {
    findFirst: (...args: unknown[]) => Promise<unknown>;
    findMany: (...args: unknown[]) => Promise<unknown[]>;
    create: (...args: unknown[]) => Promise<unknown>;
    update: (...args: unknown[]) => Promise<unknown>;
  };
}
