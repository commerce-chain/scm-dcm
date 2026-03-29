// @license MIT
// Copyright (c) Better Data, Inc.
// SPDX-License-Identifier: MIT

import type { LoopDefinition } from "../types";
import { demandSignal } from "./demand-signal";
import { order } from "./order";
import { returns } from "./returns";

export { order, returns, demandSignal };

export const dcmLoops: LoopDefinition[] = [order, returns, demandSignal];
