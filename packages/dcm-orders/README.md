# @betterdata/dcm-orders

> Order lifecycle — channel-based order routing, allocation, and fulfillment for Commerce Chain DCM.

Part of the [Commerce Chain](https://commercechain.io) open-source framework for supply chain and demand chain operations.

## Install

```bash
npm install @betterdata/dcm-orders
```

## Quick start

```typescript
import { OrderStateMachine } from "@betterdata/dcm-orders";

const { orderId } = await OrderStateMachine.createDraftOrder({} as never, {
  organizationId: "org_1",
  correlationId: "corr_1",
  lines: [{ skuId: "sku_1", quantityRequested: 1 }]
});
console.log(orderId);
```

## Documentation

→ https://commercechain.io/docs/dcm/order-management

## Part of the Commerce Chain ecosystem

| Project | Description |
|---------|-------------|
| [Loop Engine](https://loopengine.io) | Governed runtime that executes Commerce Chain loops |
| [Commerce Gateway](https://commercegateway.io) | LLM-accessible commerce data |
| [Signal Tags](https://tagd.sh) | Product authentication and traceability |

## License

Apache-2.0 © Better Data, Inc.
