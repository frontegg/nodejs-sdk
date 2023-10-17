import { RetryOptions } from '../../utils';
import { DTO } from '@frontegg/entitlements-service-types';

export enum EntitlementJustifications {
  MISSING_FEATURE = 'missing-feature',
  MISSING_PERMISSION = 'missing-permission',
  BUNDLE_EXPIRED = 'bundle-expired',
}

export interface IsEntitledResult {
  result: boolean;
  justification?: EntitlementJustifications;
}

export type FeatureKey = string;
export type TenantId = string;
export type UserId = string;

export type FeatureId = string;

export type FeatureTuple = DTO.VendorEntitlementsV1.Entitlements.Feature.Tuple;
export type FeatureBundleTuple = DTO.VendorEntitlementsV1.Entitlements.FeatureSet.Tuple;
export type EntitlementTuple = DTO.VendorEntitlementsV1.Entitlements.Tuple;
export type FeatureFlagTuple = DTO.VendorEntitlementsV1.FeatureFlags.Tuple;

export interface VendorEntitlementsSnapshotOffsetDto {
  snapshotOffset: number;
}

export interface EntitlementsClientOptions {
  initializationDelayMs: number;
  refreshTimeoutMs: number;
  retry: RetryOptions;
}
