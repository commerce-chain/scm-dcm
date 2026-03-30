# @betterdata/loop-actors

AI is an actor, not the brain. This package formalizes actor identity and transition authorization rules for loop execution.

AI can recommend transitions and may execute only where policy allows. Guards and approval constraints remain deterministic and auditable.

## Actor types

- `human`
- `automation`
- `ai-agent`
- `webhook`
- `system`

## Key APIs

- `canActorExecuteTransition()`
- `buildTransitionEvidence()`
- `isAIActorAllowed()`
- `buildAIActorEvidence()`

## Loop participant manifests

Commerce Chain modules expose a `LoopParticipantManifest` (defined in `@betterdata/loop-definitions`) so a host runtime can discover which loops and domain events they handle. This package does not define that type—it consumes the same loop/evidence model alongside Loop Engine.

## Participant validation tests

This package includes tests that assert every shipped Commerce Chain participant manifest only references known `LoopIds` and `EventNames`. Run:

```bash
pnpm test --filter @betterdata/loop-actors
```

## License

Apache-2.0 © Better Data, Inc.
