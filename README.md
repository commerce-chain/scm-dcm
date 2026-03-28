# Commerce Chain — SCM & DCM modules (OSS)

This repository mirrors the **Supply Chain Management (SCM)** and **Demand Chain Management (DCM)** open-source packages from Better Data’s monorepo (`bd-forge-main`), where they live under `packages/oss/`. In **this** repo they are rooted at:

`packages/scm-*` and `packages/dcm-*`

They are the modular kernel for [commercechain.io](https://commercechain.io) — **not** the LLM Commerce Gateway stack (that lives under a separate product line).

## Packages (intended @betterdata scope, Apache-2.0)

| Area | Package |
|------|---------|
| SCM | `scm-contracts`, `scm-catalog`, `scm-inventory`, `scm-procurement`, `scm-execution` |
| DCM | `dcm-contracts`, `dcm-demand`, `dcm-orders`, `dcm-returns` |

**Note:** `dcm-channels` is specified in the CCO architecture map but is **not yet present** in the source monorepo under `packages/oss/`.  

Loop-runtime packages (`loop-engine`, `loop-preloader`, etc.) remain **proprietary**; shared loop **definitions/events/actors** under `packages/oss/loop-*` are **not** included in this mirror — only the SCM/DCM modules above.

## Relationship to `apps/scm`

The Next.js app at `apps/scm` in `bd-forge-main` is the **composition shell** (UI, routing, deployment). The **publishable OSS surface** for commercechain is these module packages (here under `packages/`), not the `apps/scm` app source tree.

## Build & publish

These packages currently declare `workspace:*` dependencies on `@betterdata/shared-db` and `@betterdata/shared-event-bus`. They are **not yet standalone-publishable** on npm until those edges are replaced with stable semver APIs (see audit / gap report).

**Source of truth for development:** the internal monorepo; this repo is updated when OSS boundaries and publish gates are met.

## License

Apache License 2.0 — see [LICENSE](./LICENSE).
