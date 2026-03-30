# @betterdata/dcm-channels

> Channel configuration and routing overlays for Commerce Chain DCM.

Part of the [Commerce Chain](https://commercechain.io) open-source framework for supply chain and demand chain operations.

## Install

```bash
npm install @betterdata/dcm-channels
```

## Quick start

**v0.1.0 stub:** channel routing types and version only—no runtime `configure*` factory yet.

```typescript
import {
  DCM_CHANNELS_VERSION,
  type ChannelId,
  type ChannelType
} from "@betterdata/dcm-channels";

const channelType: ChannelType = "marketplace";
console.log(DCM_CHANNELS_VERSION, channelType);
```

## Documentation

→ https://commercechain.io/docs/dcm/channels

## Part of the Commerce Chain ecosystem

| Project | Description |
|---------|-------------|
| [Loop Engine](https://loopengine.io) | Governed runtime that executes Commerce Chain loops |
| [Commerce Gateway](https://commercegateway.io) | LLM-accessible commerce data |
| [Signal Tags](https://tagd.sh) | Product authentication and traceability |

## License

Apache-2.0 © Better Data, Inc.
