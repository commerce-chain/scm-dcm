# @betterdata/dcm-demand

> Demand sensing — signal ingestion, replenishment triggers, and demand pattern detection for Commerce Chain.

Part of the [Commerce Chain](https://commercechain.io) open-source framework for supply chain and demand chain operations.

## Install

```bash
npm install @betterdata/dcm-demand
```

## Quick start

```typescript
import { ForecastService } from "@betterdata/dcm-demand";
import type { ForecastDataAdapter } from "@betterdata/dcm-demand";

const adapter = {} as ForecastDataAdapter;
const forecast = new ForecastService(adapter);
const enabled = await forecast.isForecastingEnabled("org_1");
```

## Documentation

→ https://commercechain.io/docs/dcm/demand-sensing

## Part of the Commerce Chain ecosystem

| Project | Description |
|---------|-------------|
| [Loop Engine](https://loopengine.io) | Governed runtime that executes Commerce Chain loops |
| [Commerce Gateway](https://commercegateway.io) | LLM-accessible commerce data |
| [Signal Tags](https://tagd.sh) | Product authentication and traceability |

## License

Apache-2.0 © Better Data, Inc.
