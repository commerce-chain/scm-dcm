# @betterdata/scm-catalog

> Product catalog service — product/category/attribute management for the Commerce Chain SCM platform.

Part of the [Commerce Chain](https://commercechain.io) open-source framework for supply chain and demand chain operations.

## Install

```bash
npm install @betterdata/scm-catalog
```

## Quick start

Catalog helpers are mostly stateless factories and resolvers; there is **no** `configureCatalogRuntime` in this release. Use `createMarketplaceSearchService`, `createOfferNormalizerService`, and related exports for integrations.

```typescript
import {
  catalogLoopParticipant,
  preloadContribution,
  createMarketplaceSearchService
} from "@betterdata/scm-catalog";

const sessionSlice = await preloadContribution("org_1");
console.log(catalogLoopParticipant.moduleId, sessionSlice.products.length);

const search = createMarketplaceSearchService({} as never);
void search;
```

> **v0.1.0 note:** Channel configuration remains a stub in `@betterdata/dcm-channels`; expand services here as your deployment matures.

## Documentation

→ https://commercechain.io/docs/scm/catalog

## Part of the Commerce Chain ecosystem

| Project | Description |
|---------|-------------|
| [Loop Engine](https://loopengine.io) | Governed runtime that executes Commerce Chain loops |
| [Commerce Gateway](https://commercegateway.io) | LLM-accessible commerce data |
| [Signal Tags](https://tagd.sh) | Product authentication and traceability |

## License

Apache-2.0 © Better Data, Inc.
