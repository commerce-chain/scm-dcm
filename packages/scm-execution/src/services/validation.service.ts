// Copyright (c) Better Data, Inc.
// SPDX-License-Identifier: Apache-2.0

export type ValidationErrorCode = "INVALID_STATE" | "MISSING_FIELD" | "EXCEEDS_AVAILABLE";

export interface ValidationError {
  code: ValidationErrorCode;
  message: string;
}

export interface ValidationResult {
  valid: boolean;
  errors: ValidationError[];
}

export class ShipmentValidationService {
  static validateHeader(input: Record<string, unknown>): ValidationResult {
    const errors: ValidationError[] = [];
    if (!input["shipmentType"]) {
      errors.push({ code: "MISSING_FIELD", message: "shipmentType is required" });
    }
    return { valid: errors.length === 0, errors };
  }
}

export default ShipmentValidationService;
