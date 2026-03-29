// @license MIT
// Copyright (c) Better Data, Inc.
// SPDX-License-Identifier: MIT

import { z } from "zod";

export const ActorContextSchema = z.object({
  actorId: z.string(),
  actorType: z.enum(["human", "automation", "ai-agent", "webhook", "system"]),
  sessionId: z.string().optional(),
  agentId: z.string().optional(),
  ipAddress: z.string().optional()
});

const BaseSchema = z.object({
  eventId: z.string(),
  loopId: z.string(),
  aggregateId: z.string(),
  orgId: z.string(),
  occurredAt: z.string(),
  correlationId: z.string(),
  causationId: z.string().optional(),
  schemaVersion: z.literal("1.0")
});

export const LoopStartedEventSchema = BaseSchema.extend({
  type: z.literal("loop.started"),
  initialState: z.string(),
  actor: ActorContextSchema
});

export const TransitionExecutedEventSchema = BaseSchema.extend({
  type: z.literal("loop.transition.executed"),
  fromState: z.string(),
  toState: z.string(),
  transitionId: z.string(),
  actor: ActorContextSchema,
  evidence: z.record(z.string(), z.unknown()),
  durationMs: z.number().optional()
});

export const TransitionRequestedEventSchema = BaseSchema.extend({
  type: z.literal("loop.transition.requested"),
  fromState: z.string(),
  transitionId: z.string(),
  actor: ActorContextSchema,
  evidence: z.record(z.string(), z.unknown())
});

export const GuardFailedEventSchema = BaseSchema.extend({
  type: z.literal("loop.guard.failed"),
  fromState: z.string(),
  attemptedTransitionId: z.string(),
  guardId: z.string(),
  guardFailureMessage: z.string(),
  severity: z.enum(["hard", "soft"]).optional(),
  actor: ActorContextSchema
});

export const TransitionBlockedEventSchema = BaseSchema.extend({
  type: z.literal("loop.transition.blocked"),
  fromState: z.string(),
  transitionId: z.string(),
  reason: z.literal("guard_failed"),
  actor: ActorContextSchema,
  guardFailures: z.array(z.object({ guardId: z.string(), message: z.string() }))
});

export const TransitionRejectedEventSchema = BaseSchema.extend({
  type: z.literal("loop.transition.rejected"),
  fromState: z.string(),
  attemptedTransition: z.string(),
  reason: z.enum(["guard_failed", "invalid_transition", "unauthorized_actor", "loop_closed"]),
  actor: ActorContextSchema
});

export const LoopCompletedEventSchema = BaseSchema.extend({
  type: z.literal("loop.completed"),
  terminalState: z.string(),
  actor: ActorContextSchema,
  durationMs: z.number(),
  transitionCount: z.number(),
  outcomeId: z.string(),
  valueUnit: z.string()
});

export const LoopErrorEventSchema = BaseSchema.extend({
  type: z.literal("loop.error"),
  errorState: z.string(),
  errorCode: z.string(),
  errorMessage: z.string(),
  actor: ActorContextSchema
});

export const LoopSpawnedEventSchema = BaseSchema.extend({
  type: z.literal("loop.spawned"),
  parentAggregateId: z.string(),
  childLoopId: z.string(),
  childAggregateId: z.string()
});

export const SignalReceivedEventSchema = BaseSchema.extend({
  type: z.literal("loop.signal.received"),
  signalType: z.string(),
  confidence: z.number().min(0).max(1),
  triggeredLoopId: z.string().optional()
});

export const LoopEventSchema = z.discriminatedUnion("type", [
  LoopStartedEventSchema,
  TransitionRequestedEventSchema,
  TransitionExecutedEventSchema,
  TransitionBlockedEventSchema,
  GuardFailedEventSchema,
  TransitionRejectedEventSchema,
  LoopCompletedEventSchema,
  LoopErrorEventSchema,
  LoopSpawnedEventSchema,
  SignalReceivedEventSchema
]);
