// @license MIT
// Copyright (c) Better Data, Inc.
// SPDX-License-Identifier: MIT

import { z } from "zod";

export const ActorRoleSchema = z.enum(["human", "automation", "ai-agent", "webhook", "system"]);

export const BusinessMetricSchema = z.object({
  id: z.string().min(1),
  label: z.string().min(1),
  unit: z.enum(["boolean", "days", "units", "currency", "percentage"]),
  improvableByAI: z.boolean()
});

export const GuardDefinitionSchema = z.object({
  id: z.string().min(1),
  description: z.string().min(1),
  failureMessage: z.string().min(1),
  severity: z.enum(["hard", "soft"]),
  evaluatedBy: z.enum(["runtime", "module", "external"])
});

export const OutcomeSpecSchema = z.object({
  id: z.string().min(1),
  description: z.string().min(1),
  valueUnit: z.string().min(1),
  measurable: z.boolean(),
  businessMetrics: z.array(BusinessMetricSchema).min(1)
});

export const SideEffectSpecSchema = z.object({
  id: z.string().min(1),
  description: z.string().min(1),
  triggeredBy: z.string().min(1)
});

export const LoopTransitionSpecSchema = z.object({
  id: z.string().min(1),
  from: z.string().min(1),
  to: z.string().min(1),
  allowedActors: z.array(ActorRoleSchema).min(1),
  triggeredBy: z.string().min(1),
  guards: z.array(GuardDefinitionSchema).optional(),
  sideEffects: z.array(SideEffectSpecSchema).optional(),
  description: z.string().optional()
});

export const LoopDefinitionSchema = z.object({
  id: z.string().min(1),
  version: z.string().min(1),
  description: z.string().min(1),
  domain: z.string().min(1),
  states: z.array(z.string().min(1)).min(1),
  initialState: z.string().min(1),
  terminalStates: z.array(z.string().min(1)),
  errorStates: z.array(z.string().min(1)),
  transitions: z.array(LoopTransitionSpecSchema),
  outcome: OutcomeSpecSchema,
  participants: z.array(z.string().min(1)).optional(),
  spawnableLoops: z.array(z.string().min(1)).optional(),
  metadata: z.record(z.string(), z.unknown()).optional()
});
