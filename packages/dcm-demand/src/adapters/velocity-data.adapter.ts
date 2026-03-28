// Copyright (c) Better Data, Inc.
// SPDX-License-Identifier: Apache-2.0

export interface VelocityDataAdapter {
  getConsumptionSeries: (params: {
    organizationId: string;
    from: Date;
    to: Date;
    locationIds?: string[];
    productIds?: string[];
    categoryIds?: string[];
  }) => Promise<
    Array<{
      productId: string;
      locationId: string;
      date: string;
      consumed: number;
      adjusted: number;
      onHandEnd: number | null;
    }>
  >;
}
