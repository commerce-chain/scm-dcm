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

## License

Apache-2.0 © Better Data, Inc.
