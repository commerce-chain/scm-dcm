# @betterdata/loop-definitions

> Canonical loop definitions, loop ID constants, event name constants, and participant types for the Better Data Commerce Chain platform.

Part of the [Commerce Chain](https://commercechain.io) open-source framework.

## Install

```bash
npm install @betterdata/loop-definitions
```

## What's in this package

Three categories of exports work together with the Zod-validated loop specs, registry protocol, meter units, and compatibility shims:

### Loop IDs

Canonical string constants for every CCO loop:

```ts
import { LoopIds } from "@betterdata/loop-definitions";

// LoopIds.SCM_PROCUREMENT → 'scm.procurement'
// LoopIds.SCM_FULFILLMENT → 'scm.fulfillment'
// LoopIds.DCM_ORDER       → 'dcm.order'
// …see src/loop-ids.ts for the full set
```

### Event names

Canonical domain event strings (`.v1` suffix convention):

```ts
import { EventNames } from "@betterdata/loop-definitions";

// EventNames.INVENTORY_STOCK_RESERVED   → 'scm.inventory.stock_reserved.v1'
// EventNames.EXECUTION_GOODS_RECEIVED   → 'scm.execution.goods_received.v1'
// …see src/event-names.ts for the full set
```

### Loop participant types

Normalized manifest shape for module discovery:

```ts
import type { LoopParticipantManifest } from "@betterdata/loop-definitions";
```

### Loop definitions

SCM and DCM `LoopDefinition` objects, `LoopRegistry`, JSON Schema at `@betterdata/loop-definitions/schema.json`, and subpaths `@betterdata/loop-definitions/scm` and `/dcm`.

## Quick start

```ts
import { LoopIds, EventNames } from "@betterdata/loop-definitions";
import type { LoopParticipantManifest } from "@betterdata/loop-definitions";

const myModuleParticipant: LoopParticipantManifest = {
  moduleId: "scm.my-module",
  description: "Handles goods receipt in procurement loops",
  handles: [
    {
      event: EventNames.EXECUTION_GOODS_RECEIVED,
      loops: [LoopIds.SCM_PROCUREMENT, LoopIds.SCM_FULFILLMENT],
      description: "Updates module state on goods receipt"
    }
  ]
};
```

## Why constants instead of strings?

Domain modules import `LoopIds` and `EventNames` from this package instead of duplicating literals. Participant validation tests in `@betterdata/loop-actors` fail if any shipped manifest references an unknown loop ID or event name—reducing silent drift across releases.

## Documentation

→ [Commerce Chain docs](https://commercechain.io/docs/getting-started/loop-participation)

## License

Apache-2.0 © Better Data, Inc.
