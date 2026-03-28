// Copyright (c) Better Data, Inc.
// SPDX-License-Identifier: Apache-2.0

export interface LotExpiryConfig {
  requiresLot: boolean;
  requiresExpiry: boolean;
  allowPastExpiry: boolean;
  expiryWarningDays: number;
  isRegulated: boolean;
}

export interface LotExpiryValidationResult {
  valid: boolean;
  errors: ValidationError[];
  warnings: ValidationWarning[];
}

export interface ValidationError {
  field: "lotNumber" | "expiryDate" | "general";
  message: string;
  code: string;
}

export interface ValidationWarning {
  field: string;
  message: string;
  code: string;
}

export const LOT_CONTROL_ERROR_CODES = {
  PRODUCT_NOT_FOUND: "PRODUCT_NOT_FOUND",
  LOT_REQUIRED: "LOT_REQUIRED",
  EXPIRY_REQUIRED: "EXPIRY_REQUIRED",
  EXPIRED_NOT_ALLOWED: "EXPIRED_NOT_ALLOWED",
  FEATURE_NOT_ENABLED: "FEATURE_NOT_ENABLED"
} as const;

export interface InboundLineInput {
  productMasterId?: string;
  productId?: string;
  lotNumber?: string | null;
  expiryDate?: Date | string | null;
  quantity: number;
}

export interface RecordStockLineInput {
  productMasterId?: string;
  productId?: string;
  lotNumber?: string | null;
  expiryDate?: Date | string | null;
  newQty: number;
}

const STUB_ERROR = new Error(
  "LotControlService is stubbed due to schema drift. Required models: ProductTenant with lot/expiry tracking fields, TenantPackStatus, IndustryPackConfig"
);

export class LotService {
  static async getProductLotExpiryConfig(
    _productMasterId: string,
    _organizationId: string
  ): Promise<LotExpiryConfig> {
    throw STUB_ERROR;
  }

  static async validateInboundLine(
    _line: InboundLineInput,
    _organizationId: string
  ): Promise<LotExpiryValidationResult> {
    throw STUB_ERROR;
  }

  static async validateInboundLines(
    _lines: InboundLineInput[],
    _organizationId: string
  ): Promise<{
    valid: boolean;
    lineResults: Array<{ index: number; result: LotExpiryValidationResult }>;
    summary: { totalErrors: number; totalWarnings: number };
  }> {
    throw STUB_ERROR;
  }

  static async validateRecordStockLines(
    _lines: RecordStockLineInput[],
    _organizationId: string
  ): Promise<{
    valid: boolean;
    lineResults: Array<{ index: number; result: LotExpiryValidationResult }>;
    summary: { totalErrors: number; totalWarnings: number };
  }> {
    throw STUB_ERROR;
  }

  static async getLotExpiryRequirements(
    _productMasterId: string,
    _organizationId: string
  ): Promise<{
    lotRequired: boolean;
    expiryRequired: boolean;
    isRegulated: boolean;
    industryPack: string;
    message?: string;
  }> {
    throw STUB_ERROR;
  }
}

export const getProductLotExpiryConfig = LotService.getProductLotExpiryConfig.bind(LotService);
export const validateInboundLine = LotService.validateInboundLine.bind(LotService);
export const validateInboundLines = LotService.validateInboundLines.bind(LotService);
export const validateRecordStockLines = LotService.validateRecordStockLines.bind(LotService);
export const getLotExpiryRequirements = LotService.getLotExpiryRequirements.bind(LotService);
