# @betterdata/dcm-contracts

> Shared TypeScript types, event schemas, and contracts for @betterdata demand chain management modules.

Part of the [Commerce Chain](https://commercechain.io) open-source framework for supply chain and demand chain operations.

## Install

```bash
npm install @betterdata/dcm-contracts
```

## Quick start

```typescript
import type { DcmEvent, DcmOrderCreated, DomainEvent } from "@betterdata/dcm-contracts";

const evt: DcmOrderCreated = {
  eventId: "evt_1",
  eventType: "dcm.orders.order_created.v1",
  occurredAt: new Date().toISOString(),
  correlationId: "corr_1",
  schemaVersion: "1",
  payload: {
    organizationId: "org_1",
    orderId: "ord_1",
    channel: "web",
    itemCount: 1
  }
};

declare function routeDcmEvent(e: DcmEvent): void;
routeDcmEvent(evt);
```

## Documentation

→ https://commercechain.io/docs/dcm/overview

## Part of the Commerce Chain ecosystem

| Project | Description |
|---------|-------------|
| [Loop Engine](https://loopengine.io) | Governed runtime that executes Commerce Chain loops |
| [Commerce Gateway](https://commercegateway.io) | LLM-accessible commerce data |
| [Signal Tags](https://tagd.sh) | Product authentication and traceability |

## License

Apache-2.0 © Better Data, Inc.
