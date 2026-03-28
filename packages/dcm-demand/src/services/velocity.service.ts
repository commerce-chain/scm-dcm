// Copyright (c) Better Data, Inc.
// SPDX-License-Identifier: Apache-2.0

import type { VelocityDataAdapter } from "../adapters/velocity-data.adapter";

export interface VelocityInput {
  organizationId: string;
  from: string;
  to: string;
  locationIds?: string[];
  productIds?: string[];
  categoryIds?: string[];
  smoothWindow?: number;
  trimPercent?: number;
}

export interface VelocitySeriesPoint {
  date: string;
  consumed: number;
  adjusted: number;
  net: number;
}

export interface VelocityMetrics {
  average: number;
  median: number;
  cv: number;
  trendSlope: number;
  volatilityBand: { low: number; high: number };
}

export interface VelocityResult {
  productId: string;
  locationId: string;
  series: VelocitySeriesPoint[];
  smoothed: number[];
  metrics: VelocityMetrics;
}

export class VelocityService {
  constructor(private readonly adapter: VelocityDataAdapter) {}

  async calculateVelocity(input: VelocityInput): Promise<VelocityResult[]> {
    const rows = await this.adapter.getConsumptionSeries({
      organizationId: input.organizationId,
      from: new Date(input.from),
      to: new Date(input.to),
      locationIds: input.locationIds,
      productIds: input.productIds,
      categoryIds: input.categoryIds
    });

    const grouped = new Map<string, Array<(typeof rows)[number]>>();
    for (const row of rows) {
      const key = `${row.productId}::${row.locationId}`;
      const existing = grouped.get(key) ?? [];
      existing.push(row);
      grouped.set(key, existing);
    }

    const results: VelocityResult[] = [];
    for (const [key, group] of grouped.entries()) {
      group.sort((a, b) => a.date.localeCompare(b.date));
      const [productId, locationId] = key.split("::");
      const series = group.map((row) => ({
        date: row.date,
        consumed: row.consumed,
        adjusted: row.adjusted,
        net: row.consumed + row.adjusted
      }));
      const netValues = series.map((point) => point.net);
      const trimmed = this.trimOutliers(netValues, input.trimPercent ?? 10);
      const smoothed = this.movingAverage(trimmed, input.smoothWindow ?? 7);
      const metrics = this.calculateMetrics(trimmed);
      results.push({ productId, locationId, series, smoothed, metrics });
    }
    return results;
  }

  movingAverage(values: number[], window: number): number[] {
    const clamped = Math.max(1, window);
    return values.map((_, index) => {
      const start = Math.max(0, index - clamped + 1);
      const set = values.slice(start, index + 1);
      return set.reduce((sum, v) => sum + v, 0) / set.length;
    });
  }

  trimOutliers(values: number[], trimPercent: number): number[] {
    if (!values.length) return [];
    const pct = Math.max(0, Math.min(45, trimPercent));
    if (pct === 0) return [...values];
    const sorted = [...values].sort((a, b) => a - b);
    const trimCount = Math.floor((sorted.length * pct) / 100);
    if (trimCount === 0 || trimCount * 2 >= sorted.length) return [...values];
    const minAllowed = sorted[trimCount];
    const maxAllowed = sorted[sorted.length - trimCount - 1];
    return values.map((value) => Math.min(maxAllowed, Math.max(minAllowed, value)));
  }

  calculateMetrics(values: number[]): VelocityMetrics {
    if (!values.length) {
      return {
        average: 0,
        median: 0,
        cv: 0,
        trendSlope: 0,
        volatilityBand: { low: 0, high: 0 }
      };
    }
    const average = values.reduce((sum, v) => sum + v, 0) / values.length;
    const sorted = [...values].sort((a, b) => a - b);
    const median = sorted[Math.floor(sorted.length / 2)] ?? 0;
    const variance = values.reduce((sum, v) => sum + (v - average) ** 2, 0) / values.length;
    const stdDev = Math.sqrt(variance);
    const cv = average === 0 ? 0 : stdDev / Math.abs(average);
    const trendSlope = this.linearTrendSlope(values);
    return {
      average,
      median,
      cv,
      trendSlope,
      volatilityBand: { low: Math.max(0, average - stdDev), high: average + stdDev }
    };
  }

  private linearTrendSlope(values: number[]): number {
    if (values.length < 2) return 0;
    let numerator = 0;
    let denominator = 0;
    const meanX = (values.length - 1) / 2;
    const meanY = values.reduce((sum, v) => sum + v, 0) / values.length;
    for (let i = 0; i < values.length; i += 1) {
      numerator += (i - meanX) * (values[i] - meanY);
      denominator += (i - meanX) ** 2;
    }
    return denominator === 0 ? 0 : numerator / denominator;
  }
}
