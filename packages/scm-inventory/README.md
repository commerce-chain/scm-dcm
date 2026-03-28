# @betterdata/scm-inventory

> Stock engine — quantity on hand, lot tracking, reservations, and expiry management for Commerce Chain.

Part of the [Commerce Chain](https://commercechain.io) open-source framework for supply chain and demand chain operations.

## Install

```bash
npm install @betterdata/scm-inventory
```

## Quick start

```typescript
import {
  StockService,
  getAvailability,
  inventoryLoopParticipant,
  preloadContribution
} from "@betterdata/scm-inventory";

await StockService.applyQuantityOnHandChange({
  organizationId: "org_1",
  inventoryItemId: "inv_item_1",
  quantityChange: 10,
  correlationId: "corr_1",
  causationId: "cause_1"
});

const lines = await getAvailability({
  organizationId: "org_1",
  productMasterId: "pm_1"
});
```

## Documentation

→ https://commercechain.io/docs/scm/inventory

## Part of the Commerce Chain ecosystem

| Project | Description |
|---------|-------------|
| [Loop Engine](https://loopengine.io) | Governed runtime that executes Commerce Chain loops |
| [Commerce Gateway](https://commercegateway.io) | LLM-accessible commerce data |
| [Signal Tags](https://tagd.sh) | Product authentication and traceability |

## License

Apache-2.0 © Better Data, Inc.
