# commerce-chain / scm-dcm

**@betterdata/scm-\*** and **@betterdata/dcm-\*** — open-source supply chain and demand chain modules for [Commerce Chain](https://commercechain.io) (CCO), built by [Better Data](https://betterdata.com).

This repository mirrors packages from `bd-forge-main` under `packages/oss/`. Here they live at `packages/<name>/` (not under `packages/oss/`).

## Packages (Apache-2.0, @betterdata scope)

| Area | Package |
|------|---------|
| SCM | `scm-contracts`, `scm-catalog`, `scm-inventory`, `scm-procurement`, `scm-execution` |
| DCM | `dcm-contracts`, `dcm-demand`, `dcm-orders`, `dcm-channels`, `dcm-returns` |

`dcm-channels` is currently a **stub** (v0.1.0); full implementation is tracked for a later release.

Loop runtime (`loop-engine`, `loop-preloader`, …) stays **proprietary**. **`packages/oss/loop-*` in the monorepo is not mirrored here.**

## `apps/scm`

The Next.js app at `apps/scm` is the **composition shell**. Publishable OSS for commercechain.io is these **workspace packages**, not the app source.

## Build & npm

Packages may still list **`workspace:*`** dependencies on monorepo-only packages (`shared-db`, `shared-event-bus`, and in `scm-catalog` also `commerce-gateway`). External **`npm install @betterdata/...`** remains blocked until those edges are resolved (see FX3 audit below).

**Development source of truth:** internal monorepo; this repo is synced after OSS packaging work lands.

## License

Apache License 2.0 — see [LICENSE](./LICENSE).
