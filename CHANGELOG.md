# Changelog

<!-- Maintained in bd-forge-main.
     Mirrored to github.com/commerce-chain/scm-dcm on release. -->

All notable changes to the Commerce Chain SCM/DCM OSS modules will be documented here.

Format: [Keep a Changelog](https://keepachangelog.com/en/1.1.0/)
Versioning: [Semantic Versioning](https://semver.org/)

## [0.1.0] — 2026-03-11

### Added

- Initial public release of the **SCM (Supply Chain Management)** OSS packages: `@betterdata/scm-contracts`, `@betterdata/scm-catalog`, `@betterdata/scm-inventory`, `@betterdata/scm-procurement`, and `@betterdata/scm-execution` (Loop participation, preload contributions, and domain services per package README)
- Initial public release of the **DCM (Demand Chain Management)** OSS packages: `@betterdata/dcm-contracts`, `@betterdata/dcm-demand`, `@betterdata/dcm-orders`, `@betterdata/dcm-returns`, and `@betterdata/dcm-channels`
- Shared typed contracts in `@betterdata/scm-contracts` and `@betterdata/dcm-contracts` — domain events and commands, module bootstrap/backfill requests, `ScmModuleId` / `DcmModuleId`, and cross-cutting integration shapes consumed by the feature packages
- Package `repository.directory` metadata mapping each workspace package to its `packages/<name>` path on [github.com/commerce-chain/scm-dcm](https://github.com/commerce-chain/scm-dcm)
- Apache-2.0 license on all published OSS packages in this mirror

[0.1.0]: https://github.com/commerce-chain/scm-dcm/releases/tag/v0.1.0
