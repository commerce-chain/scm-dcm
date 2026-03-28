// Copyright (c) Better Data, Inc.
// SPDX-License-Identifier: Apache-2.0

import type { ForecastDataAdapter } from "../adapters/forecast-data.adapter";

export type ForecastModel = "naive" | "ma" | "ets";

export interface ForecastPoint {
  date: string;
  qty: number;
  lo?: number;
  hi?: number;
}

export interface ForecastOutput {
  generatedAt: string;
  organizationId: string;
  productId: string;
  locationId: string;
  productCode?: string;
  productName?: string;
  locationName?: string;
  modelKey: string;
  horizonDays: number;
  series: ForecastPoint[];
  mape?: number;
  smape?: number;
  features?: string[];
}

export interface GenerateForecastInput {
  organizationId: string;
  productId: string;
  locationId: string;
  from: string;
  to: string;
  horizonDays?: number;
  model?: ForecastModel;
  forceRefresh?: boolean;
}

type HistoryPoint = { date: string; qty: number };

export class ForecastService {
  constructor(
    private readonly dataAdapter: ForecastDataAdapter,
    private readonly entitlementKey = "forecasting"
  ) {}

  async isForecastingEnabled(organizationId: string): Promise<boolean> {
    if (!this.dataAdapter.checkEntitlement) return true;
    return this.dataAdapter.checkEntitlement(organizationId, this.entitlementKey);
  }

  async assertForecastingEnabled(organizationId: string): Promise<void> {
    const enabled = await this.isForecastingEnabled(organizationId);
    if (!enabled) {
      throw new Error("Forecasting not enabled for this organization");
    }
  }

  async generateForecast(input: GenerateForecastInput): Promise<ForecastOutput> {
    await this.assertForecastingEnabled(input.organizationId);
    const horizonDays = Math.max(1, Math.min(180, input.horizonDays ?? 30));
    const model = input.model ?? "ets";
    if (!input.forceRefresh && this.dataAdapter.getExistingForecast) {
      const existing = await this.dataAdapter.getExistingForecast({
        organizationId: input.organizationId,
        productId: input.productId,
        locationId: input.locationId,
        horizonDays,
        modelKey: model
      });
      if (existing) {
        return {
          generatedAt: existing.generatedAt.toISOString(),
          organizationId: input.organizationId,
          productId: input.productId,
          locationId: input.locationId,
          modelKey: existing.modelKey,
          horizonDays: existing.horizonDays,
          series: existing.series,
          mape: existing.mape ?? undefined
        };
      }
    }

    const from = new Date(input.from);
    const to = new Date(input.to);
    const history = await this.dataAdapter.getDemandHistory({
      organizationId: input.organizationId,
      productId: input.productId,
      locationId: input.locationId,
      from,
      to
    });
    const product = await this.dataAdapter.getProduct(input.productId);
    const location = await this.dataAdapter.getLocation(input.locationId);

    if (!history.length) {
      return {
        generatedAt: new Date().toISOString(),
        organizationId: input.organizationId,
        productId: input.productId,
        locationId: input.locationId,
        productCode: product?.code,
        productName: product?.name,
        locationName: location?.name,
        modelKey: model,
        horizonDays,
        series: []
      };
    }

    const evaluated = this.selectByMape(history, horizonDays, model);
    const features: string[] = ["mape-selection", "deterministic-forecast"];
    if (this.dataAdapter.saveForecast) {
      await this.dataAdapter.saveForecast({
        organizationId: input.organizationId,
        productId: input.productId,
        locationId: input.locationId,
        modelKey: evaluated.modelKey,
        horizonDays,
        series: evaluated.series,
        mape: evaluated.mape,
        smape: evaluated.smape,
        features
      });
    }

    return {
      generatedAt: new Date().toISOString(),
      organizationId: input.organizationId,
      productId: input.productId,
      locationId: input.locationId,
      productCode: product?.code,
      productName: product?.name,
      locationName: location?.name,
      modelKey: evaluated.modelKey,
      horizonDays,
      series: evaluated.series,
      mape: evaluated.mape,
      smape: evaluated.smape,
      features
    };
  }

  private selectByMape(history: HistoryPoint[], horizonDays: number, requestedModel: ForecastModel) {
    const candidates: ForecastModel[] =
      requestedModel === "ets" ? ["ets", "ma", "naive"] : [requestedModel];
    let best:
      | {
          modelKey: ForecastModel;
          series: ForecastPoint[];
          mape: number;
          smape: number;
        }
      | null = null;
    for (const candidate of candidates) {
      const series = this.forecastByModel(history, horizonDays, candidate);
      const { mape, smape } = this.errorMetrics(history, series);
      if (!best || mape < best.mape) {
        best = { modelKey: candidate, series, mape, smape };
      }
    }
    return best ?? { modelKey: requestedModel, series: [], mape: 0, smape: 0 };
  }

  private forecastByModel(history: HistoryPoint[], horizonDays: number, model: ForecastModel): ForecastPoint[] {
    if (model === "naive") return this.naiveForecast(history, horizonDays);
    if (model === "ma") return this.movingAverageForecast(history, horizonDays, 7);
    return this.simplifiedEtsForecast(history, horizonDays);
  }

  private naiveForecast(history: HistoryPoint[], horizonDays: number): ForecastPoint[] {
    const last = history[history.length - 1];
    const base = Math.max(0, Math.round(last?.qty ?? 0));
    const result: ForecastPoint[] = [];
    const startDate = new Date(last?.date ?? new Date().toISOString());
    for (let i = 1; i <= horizonDays; i += 1) {
      const nextDate = new Date(startDate);
      nextDate.setDate(nextDate.getDate() + i);
      result.push({ date: nextDate.toISOString().slice(0, 10), qty: base, lo: Math.max(0, base * 0.8), hi: base * 1.2 });
    }
    return result;
  }

  private movingAverageForecast(history: HistoryPoint[], horizonDays: number, windowSize: number): ForecastPoint[] {
    const values = history.map((item) => item.qty);
    const recent = values.slice(Math.max(0, values.length - windowSize));
    const average = recent.length ? recent.reduce((sum, v) => sum + v, 0) / recent.length : 0;
    const base = Math.max(0, Math.round(average));
    const lastDate = new Date(history[history.length - 1]?.date ?? new Date().toISOString());
    return Array.from({ length: horizonDays }).map((_, index) => {
      const date = new Date(lastDate);
      date.setDate(date.getDate() + index + 1);
      return { date: date.toISOString().slice(0, 10), qty: base, lo: Math.max(0, base * 0.82), hi: base * 1.18 };
    });
  }

  private simplifiedEtsForecast(history: HistoryPoint[], horizonDays: number): ForecastPoint[] {
    const alpha = 0.35;
    const beta = 0.12;
    let level = history[0]?.qty ?? 0;
    let trend = history.length > 1 ? history[1].qty - history[0].qty : 0;
    for (let i = 1; i < history.length; i += 1) {
      const value = history[i].qty;
      const previousLevel = level;
      level = alpha * value + (1 - alpha) * (level + trend);
      trend = beta * (level - previousLevel) + (1 - beta) * trend;
    }
    const residuals = history.slice(1).map((point, idx) => point.qty - (history[idx].qty + trend));
    const sigma = this.stdDev(residuals);
    const lastDate = new Date(history[history.length - 1]?.date ?? new Date().toISOString());
    return Array.from({ length: horizonDays }).map((_, index) => {
      const step = index + 1;
      const mean = Math.max(0, Math.round(level + trend * step));
      const band = 1.64 * sigma * Math.sqrt(step);
      const date = new Date(lastDate);
      date.setDate(date.getDate() + step);
      return {
        date: date.toISOString().slice(0, 10),
        qty: mean,
        lo: Math.max(0, Math.round(mean - band)),
        hi: Math.max(0, Math.round(mean + band))
      };
    });
  }

  private errorMetrics(history: HistoryPoint[], forecast: ForecastPoint[]): { mape: number; smape: number } {
    if (!history.length) return { mape: 0, smape: 0 };
    const actual = history.map((h) => h.qty);
    const predicted = this.inSamplePrediction(actual);
    const absPct: number[] = [];
    const symmetric: number[] = [];
    for (let i = 0; i < actual.length; i += 1) {
      const a = actual[i];
      const p = predicted[i] ?? forecast[0]?.qty ?? 0;
      if (a !== 0) absPct.push(Math.abs((a - p) / a) * 100);
      const denom = Math.abs(a) + Math.abs(p);
      if (denom !== 0) symmetric.push((2 * Math.abs(a - p)) / denom * 100);
    }
    return {
      mape: absPct.length ? absPct.reduce((sum, v) => sum + v, 0) / absPct.length : 0,
      smape: symmetric.length ? symmetric.reduce((sum, v) => sum + v, 0) / symmetric.length : 0
    };
  }

  private inSamplePrediction(actual: number[]): number[] {
    if (!actual.length) return [];
    const result: number[] = [actual[0]];
    for (let i = 1; i < actual.length; i += 1) {
      result.push(actual.slice(Math.max(0, i - 7), i).reduce((sum, v) => sum + v, 0) / Math.max(1, Math.min(i, 7)));
    }
    return result;
  }

  private stdDev(values: number[]): number {
    if (!values.length) return 0;
    const mean = values.reduce((sum, v) => sum + v, 0) / values.length;
    const variance = values.reduce((sum, v) => sum + (v - mean) ** 2, 0) / values.length;
    return Math.sqrt(variance);
  }
}
