# @betterdata/scm-procurement

> Purchase order lifecycle — PO creation, approval loops, and supplier management for Commerce Chain.

Part of the [Commerce Chain](https://commercechain.io) open-source framework for supply chain and demand chain operations.

## Install

```bash
npm install @betterdata/scm-procurement
```

## Quick start

```typescript
import { POStatusEngine, procurementLoopParticipant } from "@betterdata/scm-procurement";

const lineStatus = POStatusEngine.computeLineStatus({
  id: "line_1",
  qty: 10,
  shippedQty: 0,
  receivedQty: 0,
  invoicedQty: 0,
  isCancelled: false
});

console.log(lineStatus, procurementLoopParticipant.module);
```

## Documentation

→ https://commercechain.io/docs/scm/procurement

## Part of the Commerce Chain ecosystem

| Project | Description |
|---------|-------------|
| [Loop Engine](https://loopengine.io) | Governed runtime that executes Commerce Chain loops |
| [Commerce Gateway](https://commercegateway.io) | LLM-accessible commerce data |
| [Signal Tags](https://tagd.sh) | Product authentication and traceability |

## License

Apache-2.0 © Better Data, Inc.
