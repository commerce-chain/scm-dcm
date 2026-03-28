// Copyright (c) Better Data, Inc.
// SPDX-License-Identifier: Apache-2.0

export type DemandLoopEvent =
  | "dcm.demand.replenishment_triggered.v1"
  | "dcm.demand.threshold_breach_detected.v1";

export type DemandLoopParticipant = {
  module: "dcm-demand";
  handles: Array<{
    event: DemandLoopEvent;
    loops: string[];
  }>;
};

export const demandLoopParticipant: DemandLoopParticipant = {
  module: "dcm-demand",
  handles: [
    {
      event: "dcm.demand.replenishment_triggered.v1",
      loops: ["dcm.demand"]
    },
    {
      event: "dcm.demand.threshold_breach_detected.v1",
      loops: ["dcm.demand"]
    }
  ]
};
