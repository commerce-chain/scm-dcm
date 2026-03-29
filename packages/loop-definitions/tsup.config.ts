// Copyright (c) Better Data, Inc. and contributors
// SPDX-License-Identifier: Apache-2.0

import { defineConfig } from "tsup";

export default defineConfig({
  entry: ["src/index.ts", "src/scm/index.ts", "src/dcm/index.ts"],
  format: ["esm", "cjs"],
  dts: {
    compilerOptions: {
      module: "ESNext",
      moduleResolution: "bundler"
    }
  },
  sourcemap: true,
  clean: true,
  outDir: "dist",
  external: ["zod"]
});
