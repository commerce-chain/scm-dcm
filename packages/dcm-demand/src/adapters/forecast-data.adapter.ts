// Copyright (c) Better Data, Inc.
// SPDX-License-Identifier: Apache-2.0

export interface ForecastDataAdapter {
  checkEntitlement?: (organizationId: string, entitlementKey: string) => Promise<boolean>;
  getDemandHistory: (params: {
    organizationId: string;
    productId: string;
    locationId: string;
    from: Date;
    to: Date;
  }) => Promise<Array<{ date: string; qty: number }>>;
  getProduct: (productId: string) => Promise<{ id: string; code: string; name: string } | null>;
  getLocation: (locationId: string) => Promise<{ id: string; name: string } | null>;
  getExistingForecast?: (params: {
    organizationId: string;
    productId: string;
    locationId: string;
    horizonDays: number;
    modelKey?: string;
  }) => Promise<{
    generatedAt: Date;
    modelKey: string;
    horizonDays: number;
    series: Array<{ date: string; qty: number; lo?: number; hi?: number }>;
    mape?: number | null;
  } | null>;
  saveForecast?: (forecast: {
    organizationId: string;
    productId: string;
    locationId: string;
    modelKey: string;
    horizonDays: number;
    series: Array<{ date: string; qty: number; lo?: number; hi?: number }>;
    mape?: number;
    smape?: number;
    features?: string[];
  }) => Promise<void>;
}
