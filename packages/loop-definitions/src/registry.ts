// @license MIT
// Copyright (c) Better Data, Inc.
// SPDX-License-Identifier: MIT

import { dcmLoops } from "./dcm";
import { LoopDefinitionSchema } from "./schema";
import { scmLoops } from "./scm";
import type { GuardDefinition, LoopDefinition } from "./types";

export class LoopRegistry {
  private definitions: Map<string, LoopDefinition> = new Map();

  register(definition: LoopDefinition): void {
    const parsed = LoopDefinitionSchema.safeParse(definition);
    if (!parsed.success) {
      throw new Error(`Invalid loop definition: ${parsed.error.issues.map((i) => i.message).join("; ")}`);
    }
    if (this.definitions.has(definition.id)) {
      throw new Error(`Loop definition already registered: ${definition.id}`);
    }
    this.definitions.set(definition.id, definition);
  }

  get(loopId: string): LoopDefinition | undefined {
    return this.definitions.get(loopId);
  }

  list(domain?: string): LoopDefinition[] {
    const definitions = [...this.definitions.values()];
    return domain ? definitions.filter((definition) => definition.domain === domain) : definitions;
  }

  validate(definition: unknown): { valid: boolean; errors: string[] } {
    const parsed = LoopDefinitionSchema.safeParse(definition);
    return parsed.success
      ? { valid: true, errors: [] }
      : { valid: false, errors: parsed.error.issues.map((issue) => `${issue.path.join(".")}: ${issue.message}`) };
  }

  getGuardsForTransition(loopId: string, transitionId: string): GuardDefinition[] {
    const loop = this.get(loopId);
    if (!loop) return [];
    const transition = loop.transitions.find((entry) => entry.id === transitionId);
    return transition?.guards ?? [];
  }

  getHardGuardsForTransition(loopId: string, transitionId: string): GuardDefinition[] {
    return this.getGuardsForTransition(loopId, transitionId).filter((guard) => guard.severity === "hard");
  }

  static createWithBuiltins(): LoopRegistry {
    const registry = new LoopRegistry();
    [...scmLoops, ...dcmLoops].forEach((definition) => registry.register(definition));
    return registry;
  }
}
