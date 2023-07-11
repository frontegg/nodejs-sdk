import { RetryOptions } from '../../utils';

export enum EntitlementReasons {
  MISSING_FEATURE = 'missing-feature',
  MISSING_PERMISSION = 'missing-permission',
  BUNDLE_EXPIRED = 'bundle-expired',
}

export interface IsEntitledResult {
  result: boolean;
  reason?: EntitlementReasons;
}

export interface FeatureDto {
  id: string;
  featureKey: string;
  permissions?: string[];
}

export interface FeatureBundleDto {
  id: string;
  featureBundleKey: string;
  featureIds: string[];
}

export interface EntitlementsDto {
  featureBundleId: string;
  tenantId: string;
  userId?: string; // If userId exist it means the entitlement is for specific user
  expirationDate?: string;
}

export interface VendorEntitlementsDto {
  data: {
    features: FeatureDto[];
    featureBundles: FeatureBundleDto[];
    entitlements: EntitlementsDto[];
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

export type FeatureKey = string;
export type TenantId = string;
export type UserId = string;
