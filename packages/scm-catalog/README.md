# @betterdata/scm-catalog

> Product catalog service — product/category/attribute management for the Commerce Chain SCM platform.

Part of the [Commerce Chain](https://commercechain.io) open-source framework for supply chain and demand chain operations.

## Install

```bash
npm install @betterdata/scm-catalog
```

## Quick start

```typescript
import { catalogLoopParticipant, preloadContribution } from "@betterdata/scm-catalog";

const sessionSlice = await preloadContribution("org_1");
console.log(catalogLoopParticipant.module, sessionSlice.products.length);
```

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
