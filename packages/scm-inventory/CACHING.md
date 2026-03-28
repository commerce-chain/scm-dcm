<!--
Copyright (c) Better Data, Inc.
SPDX-License-Identifier: Apache-2.0
-->

# SCM Inventory Caching Policy

`@betterdata/scm-inventory` treats inventory reads as **dynamic-only**.

## Rule

- Quantity-on-hand (QOH) and reservation-derived availability must never be served from cache.
- Consumers should enforce dynamic execution semantics (`force-dynamic` or equivalent).

## Why

- Reservation state changes at high frequency.
- Cached inventory values can violate fulfillment correctness and loop decisions.
- Fresh reads are required for `scm.execution.GoodsReceived` and `scm.inventory.StockReserved` flow handling.
