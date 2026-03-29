# @betterdata/loop-definitions

Portable loop definition DSL for any Loop Engine runtime. This package contains loop shapes, canonical SCM/DCM loop definitions, and validation tooling.

Install:

`npm install @betterdata/loop-definitions`

Define a loop:

```ts
import type { LoopDefinition } from "@betterdata/loop-definitions";

const crmLoop: LoopDefinition = {
  id: "crm.lead-conversion",
  version: "1.0.0",
  description: "Lead conversion workflow",
  domain: "crm",
  states: ["OPEN", "QUALIFIED", "CLOSED"],
  initialState: "OPEN",
  terminalStates: ["CLOSED"],
  errorStates: [],
  transitions: [
    {
      id: "qualify",
      from: "OPEN",
      to: "QUALIFIED",
      triggeredBy: "crm.lead.qualified.v1",
      allowedActors: ["human", "automation", "system"]
    }
  ],
  outcome: {
    id: "lead_converted",
    description: "Lead converted to opportunity",
    valueUnit: "lead_converted",
    measurable: true,
    businessMetrics: [{ id: "conversion_rate", label: "Conversion rate", unit: "percentage", improvableByAI: true }]
  }
};
```

Validate a loop definition:

```ts
import { LoopRegistry } from "@betterdata/loop-definitions";

const result = new LoopRegistry().validate({});
```

Use canonical definitions:

```ts
import { scmLoops } from "@betterdata/loop-definitions/scm";
import { dcmLoops } from "@betterdata/loop-definitions/dcm";
```

JSON Schema:

- `@betterdata/loop-definitions/schema.json`
- `packages/oss/loop-definitions/schema/loop-definition.schema.json`

Loop Registry Protocol:

The loop registry protocol defines how Loop Engine runtimes expose their loop catalogs. Better Data's SaaS platform can implement this protocol, and third-party runtimes can implement the same protocol.

Publishing your own loops:
1. Define loops using `LoopDefinition`
2. Create a `LoopPackageManifest`
3. Publish to npm
4. Register with a compatible runtime

Boundary note:

This package defines loop shapes. It does not execute loops. To execute loops, you need a Loop Engine runtime. Better Data's SaaS platform is one implementation; the definition format is runtime-agnostic.

## License

Apache-2.0 © Better Data, Inc.
