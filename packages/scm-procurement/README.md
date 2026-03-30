# @betterdata/scm-procurement

> Purchase order lifecycle — PO creation, approval loops, and supplier management for Commerce Chain.

Part of the [Commerce Chain](https://commercechain.io) open-source framework for supply chain and demand chain operations.

## Install

```bash
npm install @betterdata/scm-procurement
```

## Quick start

Configure runtime wiring once (outbox + channel reader), then use procurement services.

```typescript
import { configureProcurementRuntime, POStatusEngine, procurementLoopParticipant } from "@betterdata/scm-procurement";
import type { ChannelReader, OutboxWriter } from "@betterdata/scm-contracts";

configureProcurementRuntime({
  outbox: myOutbox as OutboxWriter,
  readChannelMessages: myChannelReader as ChannelReader
});

const lineStatus = POStatusEngine.computeLineStatus({
  id: "line_1",
  qty: 10,
  shippedQty: 0,
  receivedQty: 0,
  invoicedQty: 0,
  isCancelled: false
});

console.log(lineStatus, procurementLoopParticipant.moduleId);
```

`loop-manifest.ts` / `loop-inbox.ts` split: pure `LoopParticipantManifest` lives in `loop-manifest`; `processProcurementLoopBatch` lives in `loop-inbox`. Both are re-exported from `loop-participation` (and the package root) for backward compatibility.

→ [Runtime configuration](https://commercechain.io/docs/getting-started/runtime-configuration)

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
