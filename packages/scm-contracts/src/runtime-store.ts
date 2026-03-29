// Copyright (c) Better Data, Inc. and contributors
// SPDX-License-Identifier: Apache-2.0

/**
 * Typed singleton for module runtime wiring (outbox, channel reader, db).
 */
export function createModuleRuntimeStore<T>(packageLabel: string, configureHint: string) {
  let store: T | undefined;

  return {
    configure(runtime: T): void {
      store = runtime;
    },
    get(): T {
      if (store === undefined) {
        throw new Error(
          `${packageLabel}: runtime not configured. Call ${configureHint} before using services that touch the bus. ` +
            "See: https://commercechain.io/docs/runtime-configuration"
        );
      }
      return store;
    },
    /** @internal For tests only */
    reset(): void {
      store = undefined;
    }
  };
}
