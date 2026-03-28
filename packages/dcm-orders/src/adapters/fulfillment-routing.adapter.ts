// Copyright (c) Better Data, Inc.
// SPDX-License-Identifier: Apache-2.0

export interface FulfillmentRoutingInput {
  organizationId: string;
  orderId: string;
  orderLineId: string;
  skuId: string;
  quantityRequested: number;
}

export interface FulfillmentRoutingResult {
  locationId: string;
  reason?: string;
}

/**
 * Injection point for future proprietary fulfillment routing.
 * Default behavior without an adapter is first available location with sufficient stock.
 */
export interface FulfillmentRoutingAdapter {
  routeOrderLine(input: FulfillmentRoutingInput): Promise<FulfillmentRoutingResult>;
}
