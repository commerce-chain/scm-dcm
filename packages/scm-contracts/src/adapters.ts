// Copyright (c) Better Data, Inc.
// SPDX-License-Identifier: Apache-2.0

/**
 * Outbox payload for domain events. Matches the shape consumed by typical Prisma
 * `outboxEntry.create` implementations (e.g. @betterdata/shared-event-bus).
 */
export interface OutboxWriteInput {
  aggregateType: string;
  aggregateId: string;
  eventType: string;
  payload: unknown;
  organizationId: string;
  correlationId: string;
  causationId: string;
}

/**
 * Writes a domain event inside (or outside) the active transaction client.
 * Host apps wire this to `writeOutboxEntry` from their infrastructure package.
 */
export interface OutboxWriter {
  write(tx: unknown, event: OutboxWriteInput): Promise<void>;
}

/** Channel message row shape used by inventory / procurement loop consumers. */
export interface EventChannelMessageRecord {
  id: string;
  channel: string;
  outboxEntryId: string;
  payload: unknown;
  publishedAt: Date;
  organizationId: string;
  correlationId: string;
}

export type ChannelReader = (
  db: unknown,
  channel: string,
  afterId?: string,
  limit?: number
) => Promise<EventChannelMessageRecord[]>;

/** Minimal DB root / transaction surface used across CCO OSS modules. */
export interface ModuleDb {
  $transaction: <T>(fn: (tx: unknown) => Promise<T>) => Promise<T>;
}
