// @license MIT
// Copyright (c) Better Data, Inc.
// SPDX-License-Identifier: MIT

export interface LoopEventBase {
  eventId: string;
  loopId: string;
  aggregateId: string;
  orgId: string;
  occurredAt: string;
  correlationId: string;
  causationId?: string;
  schemaVersion: "1.0";
}

export interface ActorContext {
  actorId: string;
  actorType: "human" | "automation" | "ai-agent" | "webhook" | "system";
  sessionId?: string;
  agentId?: string;
  ipAddress?: string;
}

export type Evidence = Record<string, unknown>;

export interface LoopStartedEvent extends LoopEventBase {
  type: "loop.started";
  initialState: string;
  actor: ActorContext;
}

export interface TransitionExecutedEvent extends LoopEventBase {
  type: "loop.transition.executed";
  fromState: string;
  toState: string;
  transitionId: string;
  actor: ActorContext;
  evidence: Evidence;
  durationMs?: number;
}

export interface TransitionRequestedEvent extends LoopEventBase {
  type: "loop.transition.requested";
  fromState: string;
  transitionId: string;
  actor: ActorContext;
  evidence: Evidence;
}

export interface GuardFailedEvent extends LoopEventBase {
  type: "loop.guard.failed";
  fromState: string;
  attemptedTransitionId: string;
  guardId: string;
  guardFailureMessage: string;
  severity?: "hard" | "soft";
  actor: ActorContext;
}

export interface TransitionBlockedEvent extends LoopEventBase {
  type: "loop.transition.blocked";
  fromState: string;
  transitionId: string;
  reason: "guard_failed";
  actor: ActorContext;
  guardFailures: Array<{ guardId: string; message: string }>;
}

export interface TransitionRejectedEvent extends LoopEventBase {
  type: "loop.transition.rejected";
  fromState: string;
  attemptedTransition: string;
  reason: "guard_failed" | "invalid_transition" | "unauthorized_actor" | "loop_closed";
  actor: ActorContext;
}

export interface LoopCompletedEvent extends LoopEventBase {
  type: "loop.completed";
  terminalState: string;
  actor: ActorContext;
  durationMs: number;
  transitionCount: number;
  outcomeId: string;
  valueUnit: string;
}

export interface LoopErrorEvent extends LoopEventBase {
  type: "loop.error";
  errorState: string;
  errorCode: string;
  errorMessage: string;
  actor: ActorContext;
}

export interface LoopSpawnedEvent extends LoopEventBase {
  type: "loop.spawned";
  parentAggregateId: string;
  childLoopId: string;
  childAggregateId: string;
}

export interface SignalReceivedEvent extends LoopEventBase {
  type: "loop.signal.received";
  signalType: string;
  confidence: number;
  triggeredLoopId?: string;
}

export type LoopEvent =
  | LoopStartedEvent
  | TransitionRequestedEvent
  | TransitionExecutedEvent
  | TransitionBlockedEvent
  | GuardFailedEvent
  | TransitionRejectedEvent
  | LoopCompletedEvent
  | LoopErrorEvent
  | LoopSpawnedEvent
  | SignalReceivedEvent;
