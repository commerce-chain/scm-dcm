// Copyright (c) Better Data, Inc.
// SPDX-License-Identifier: Apache-2.0

// DCM Channels — channel configuration and routing overlays
// Full implementation planned for Commerce Chain v0.2.0
// See: https://commercechain.io/docs/dcm/channels

export const DCM_CHANNELS_VERSION = "0.1.0";

/** Branded channel identifier (opaque string). */
export type ChannelId = string & { readonly __brand: "ChannelId" };

export type ChannelType = "direct" | "marketplace" | "retail" | "wholesale" | "dtc";
