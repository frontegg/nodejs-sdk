import { RetryOptions } from '../../utils';
import { Permission } from '../identity/types';

export enum EntitlementReasons {
  MISSING_FEATURE = 'missing-feature',
  MISSING_PERMISSION = 'missing-permission',
  BUNDLE_EXPIRED = 'bundle-expired',
}

export interface IsEntitledResult {
  result: boolean;
  reason?: EntitlementReasons;
}

export type FeatureKey = string;
export type TenantId = string;
export type UserId = string;

export type FeatureId = string;
export type FeatureTuple = [FeatureId, FeatureKey, Permission[]];

export type FeatureBundleId = string;
export type FeatureBundleTuple = [FeatureBundleId, FeatureId[]];

export type ExpirationDate = string | null;
export type EntitlementTuple = [FeatureBundleId, TenantId, UserId?, ExpirationDate?];

export interface VendorEntitlementsDto {
  data: {
    features: FeatureTuple[];
    featureBundles: FeatureBundleTuple[];
    entitlements: EntitlementTuple[];
  };
  snapshotOffset: number;
}

export interface VendorEntitlementsSnapshotOffsetDto {
  snapshotOffset: number;
}

export interface EntitlementsClientOptions {
  initializationDelayMs: number;
  refreshTimeoutMs: number;
  retry: RetryOptions;
}
