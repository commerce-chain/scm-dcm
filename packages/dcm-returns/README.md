# @betterdata/dcm-returns

> Returns lifecycle — return authorization, processing, and disposition loops for Commerce Chain DCM.

Part of the [Commerce Chain](https://commercechain.io) open-source framework for supply chain and demand chain operations.

## Install

```bash
npm install @betterdata/dcm-returns
```

## Quick start

```typescript
import { RmaStateMachineService } from "@betterdata/dcm-returns";

await RmaStateMachineService.approveRma({
  prisma: {} as never,
  organizationId: "org_1",
  rmaId: "rma_1",
  actorId: "user_1",
  correlationId: "corr_1"
});
```

## Documentation

→ https://commercechain.io/docs/dcm/returns

## Part of the Commerce Chain ecosystem

| Project | Description |
|---------|-------------|
| [Loop Engine](https://loopengine.io) | Governed runtime that executes Commerce Chain loops |
| [Commerce Gateway](https://commercegateway.io) | LLM-accessible commerce data |
| [Signal Tags](https://tagd.sh) | Product authentication and traceability |

## License

Apache-2.0 © Better Data, Inc.
