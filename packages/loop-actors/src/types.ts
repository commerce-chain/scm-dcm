// @license MIT
// Copyright (c) Better Data, Inc.
// SPDX-License-Identifier: MIT

export type ActorType = "human" | "automation" | "ai-agent" | "webhook" | "system";

export interface HumanActor {
  type: "human";
  actorId: string;
  displayName?: string;
  sessionId: string;
  orgId: string;
}

export interface AutomationActor {
  type: "automation";
  actorId: string;
  serviceId: string;
  orgId: string;
}

export interface AIAgentActor {
  type: "ai-agent";
  actorId: string;
  agentId: string;
  gatewaySessionId: string;
  orgId: string;
  recommendedBy?: string;
}

export interface WebhookActor {
  type: "webhook";
  actorId: string;
  source: string;
  orgId: string;
}

export interface SystemActor {
  type: "system";
  actorId: string;
  orgId: string;
}

export type Actor = HumanActor | AutomationActor | AIAgentActor | WebhookActor | SystemActor;
