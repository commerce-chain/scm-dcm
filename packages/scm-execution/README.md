# @betterdata/scm-execution

> Fulfillment execution — pick, pack, ship, and receive operations for Commerce Chain SCM.

Part of the [Commerce Chain](https://commercechain.io) open-source framework for supply chain and demand chain operations.

## Install

```bash
npm install @betterdata/scm-execution
```

## Quick start

```typescript
import {
  configureExecutionRuntime,
  ShipmentStateMachine,
  executionLoopParticipant,
  ExecutionLoopParticipant
} from "@betterdata/scm-execution";
import type { ChannelReader, OutboxWriter } from "@betterdata/scm-contracts";

configureExecutionRuntime({
  outbox: myOutbox as OutboxWriter,
  readChannelMessages: myChannelReader as ChannelReader
});

const allowed = ShipmentStateMachine.canTransition("PICKING", "PICKED");
console.log(allowed, executionLoopParticipant.moduleId);
// ExecutionLoopParticipant is a deprecated alias for the same manifest object
```

→ [Runtime configuration](https://commercechain.io/docs/getting-started/runtime-configuration)

## Documentation

→ https://commercechain.io/docs/scm/execution

## Part of the Commerce Chain ecosystem

| Project | Description |
|---------|-------------|
| [Loop Engine](https://loopengine.io) | Governed runtime that executes Commerce Chain loops |
| [Commerce Gateway](https://commercegateway.io) | LLM-accessible commerce data |
| [Signal Tags](https://tagd.sh) | Product authentication and traceability |

## License

Apache-2.0 © Better Data, Inc.
