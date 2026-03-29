// @license MIT
// Copyright (c) Better Data, Inc.
// SPDX-License-Identifier: MIT

import type { LoopDefinition } from "../types";
import { fulfillment } from "./fulfillment";
import { inventory } from "./inventory";
import { procurement } from "./procurement";
import { quality } from "./quality";
import { replenishment } from "./replenishment";

export { procurement, fulfillment, quality, replenishment, inventory };

export const scmLoops: LoopDefinition[] = [procurement, fulfillment, quality, replenishment, inventory];
