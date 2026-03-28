// Copyright (c) Better Data, Inc.
// SPDX-License-Identifier: Apache-2.0

export {
  catalogLoopParticipant
} from "./loop-participation";
export type { CatalogLoopParticipant } from "./loop-participation";

export { preloadContribution } from "./preload-contribution";
export type { CatalogPreloadContribution } from "./preload-contribution";

export {
  batchResolveProductMasters,
  resolveProductMaster,
  toResolverInput
} from "./services/product-master-resolver";
export {
  createMarketplaceSearchService,
  MarketplaceSearchService
} from "./services/marketplace-search.service";
export {
  createOfferNormalizerService,
  OfferNormalizerService
} from "./services/offer-normalizer.service";
export type {
  MarketplaceImportContext,
  ProductMasterResolveResult,
  TransactionalDbClient,
  VendorProductResolverInput
} from "./services/product-master-resolver";
export type {
  MarketplaceProductResult,
  MarketplaceSearchDataAdapter,
  MarketplaceSearchFilters,
  MarketplaceSearchQuery,
  MarketplaceSearchResponse,
  MarketplaceSearchServiceConfig,
  SearchScope
} from "./services/marketplace-search.service";
export type {
  CentralizedListing,
  FederatedResult,
  FederationAttribution,
  FederationMerchantTier,
  FederationProduct,
  FederationSearchResult,
  NormalizedOffer,
  OfferNormalizerConfig
} from "./services/offer-normalizer.service";
export type {
  ImportContext,
  ProductMasterImportAdapter,
  RawProductPayload
} from "./adapters/product-master-import.adapter";
export type {
  RankedListing,
  RankingAdapter,
  RankingSearchResultRow,
  RankingUserLocation
} from "./adapters/ranking.adapter";
export type { TrustScoringAdapter } from "./adapters/trust-scoring.adapter";
export type {
  HybridSearchAdapter,
  HybridSearchQuery,
  HybridSearchResult
} from "./adapters/hybrid-search.adapter";
export type {
  ProductMatcherAdapter,
  ProductMatcherInput,
  ProductMatcherResult
} from "./adapters/product-matcher.adapter";

export function catalogTagForOrg(orgId: string): string {
  return `catalog:${orgId}`;
}
