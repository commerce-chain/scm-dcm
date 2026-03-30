# @betterdata/loop-events

Event schema for the Loop Engine runtime. These events are the portable operational and learning surface for analytics, observability, and AI optimization.

## Event types

- `loop.started`
- `loop.transition.executed`
- `loop.guard.failed`
- `loop.transition.rejected`
- `loop.completed`
- `loop.error`
- `loop.spawned`
- `loop.signal.received`

## Usage

Parse inbound events with `LoopEventSchema`, then derive training-ready records via `extractLearningSignal`.

## Versioning policy

`schemaVersion` is stable and additive. Breaking event shape changes require a major release and migration notice.

## Commerce Chain domain events

Operational loop-runtime events in this package (`loop.started`, `loop.transition.executed`, …) are separate from **Commerce Chain domain** event strings (for example `scm.inventory.stock_reserved.v1`). Those domain identifiers live in `@betterdata/loop-definitions` as `EventNames`:

```ts
import { EventNames } from "@betterdata/loop-definitions";
```

## License

Apache-2.0 © Better Data, Inc.
