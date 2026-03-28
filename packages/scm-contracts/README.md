# @betterdata/scm-contracts

> Shared TypeScript types, event schemas, and contracts for @betterdata supply chain management modules.

Part of the [Commerce Chain](https://commercechain.io) open-source framework for supply chain and demand chain operations.

## Install

```bash
npm install @betterdata/scm-contracts
```

## Quick start

```typescript
import type {
  DomainEvent,
  ScmInventoryStockReserved,
  ScmEvent
} from "@betterdata/scm-contracts";

const example: ScmInventoryStockReserved = {
  eventId: "evt_1",
  eventType: "scm.inventory.stock_reserved.v1",
  occurredAt: new Date().toISOString(),
  correlationId: "corr_1",
  causationId: "cause_1",
  schemaVersion: "1",
  payload: {
    organizationId: "org_1",
    skuId: "sku_1",
    locationId: "loc_1",
    quantityReserved: 2,
    reservationId: "res_1",
    reservationType: "CUSTOMER_ORDER",
    orderId: "ord_1",
    orderLineId: "line_1",
    correlationId: "corr_1",
    causationId: "cause_1"
  }
};

declare function handleScmEvent(event: ScmEvent): void;
handleScmEvent(example);
```

## Documentation

→ https://commercechain.io/docs/scm/overview

## Part of the Commerce Chain ecosystem

| Project | Description |
|---------|-------------|
| [Loop Engine](https://loopengine.io) | Governed runtime that executes Commerce Chain loops |
| [Commerce Gateway](https://commercegateway.io) | LLM-accessible commerce data |
| [Signal Tags](https://tagd.sh) | Product authentication and traceability |

## License

Apache-2.0 © Better Data, Inc.
