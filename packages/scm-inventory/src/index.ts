// Copyright (c) Better Data, Inc.
// SPDX-License-Identifier: Apache-2.0

export { configureInventoryRuntime } from "./runtime";

export { StockService } from "./services/stock.service";
export {
  getAvailability,
  checkAvailability,
  recomputeAvailability,
  consumeReturnReceived
} from "./services/stock.service";
export type {
  AvailabilityQuery,
  StockLineAvailability,
  AvailabilityCheckParams,
  AvailabilityCheckResult
} from "./services/stock.service";

export { ReservationService } from "./services/reservation.service";
export {
  createSoftReservation,
  confirmSoftReservation,
  convertToHardReservation,
  releaseSoftReservation,
  releaseExpiredReservations,
  bulkReleaseReservations,
  getReservation,
  getActiveReservations
} from "./services/reservation.service";
export type {
  SoftReserveRequest,
  SoftReserveResponse,
  ConvertToHardRequest,
  ConvertToHardResponse,
  ReleaseRequest,
  ReleaseResponse,
  BulkReleaseRequest,
  BulkReleaseResponse
} from "./services/reservation.service";
export { ReservationErrorCode } from "./services/reservation.service";

export { LotService } from "./services/lot.service";
export {
  LOT_CONTROL_ERROR_CODES,
  getProductLotExpiryConfig,
  validateInboundLine,
  validateInboundLines,
  validateRecordStockLines,
  getLotExpiryRequirements
} from "./services/lot.service";
export type {
  LotExpiryConfig,
  LotExpiryValidationResult,
  ValidationError,
  ValidationWarning,
  InboundLineInput,
  RecordStockLineInput
} from "./services/lot.service";

export {
  inventoryLoopParticipant
} from "./loop-participation";
export type { InventoryLoopParticipant } from "./loop-participation";

export { preloadContribution } from "./preload-contribution";
export type { InventoryPreloadContribution } from "./preload-contribution";
