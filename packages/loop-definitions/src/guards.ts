// @license MIT
// Copyright (c) Better Data, Inc.
// SPDX-License-Identifier: MIT

import type { GuardDefinition } from "./types";

export type WellKnownGuard =
  | "budget_available"
  | "supplier_approved"
  | "quantity_within_threshold"
  | "three_way_match"
  | "lot_not_on_hold"
  | "quality_hold_released"
  | "stock_below_reorder_point"
  | "forecast_confidence_met"
  | "actor_has_permission"
  | "approval_obtained"
  | "deadline_not_exceeded"
  | "duplicate_check_passed";

export const defaultGuard = (
  id: WellKnownGuard | string,
  severity: GuardDefinition["severity"] = "hard",
  evaluatedBy: GuardDefinition["evaluatedBy"] = "runtime"
): GuardDefinition => ({
  id,
  description: id.replaceAll("_", " "),
  failureMessage: `${id} check failed`,
  severity,
  evaluatedBy
});
