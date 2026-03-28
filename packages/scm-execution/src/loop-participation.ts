// Copyright (c) Better Data, Inc.
// SPDX-License-Identifier: Apache-2.0

// SCM Execution — loop participation interface (stub)
// Handles: scm.fulfillment loops, scm.quality loops
// Full handlers planned for Commerce Chain v0.2.0

export const ExecutionLoopParticipant = {
  moduleId: "scm.execution",
  handles: [
    {
      event: "scm.procurement.purchase_order_confirmed",
      loops: ["scm.fulfillment"],
      description: "Triggers fulfillment execution on PO confirmation"
    },
    {
      event: "scm.execution.goods_received",
      loops: ["scm.procurement", "scm.fulfillment", "scm.quality"],
      description: "Updates loop state on goods receipt"
    }
  ]
};
