import { Permission } from '../../../identity/types';
import { FeatureKey, TenantId, UserId } from '../../types';
import { ExpirationTime } from '../types';
// TODO: make that lib VVV export types as well
import { FeatureFlag } from '@frontegg/entitlements-javascript-commons/dist/feature-flags/types';

export const UNBUNDLED_SRC_ID = '__unbundled__';
export type FeatureEntitlementKey = string; // tenant & user & feature key
export type EntitlementsMap = Map<FeatureEntitlementKey, ExpirationTime>;
export type PermissionsMap = Map<Permission, Set<FeatureKey>>;

export type FeatureSource = {
  id: string;
  key: FeatureKey;
  permissions: Set<Permission>;
};

export type SingleEntityEntitlements<T> = Map<T, number[]>;

export type SingleBundleSource = {
  id: string;
  features: Map<string, FeatureSource>;
  user_entitlements: Map<TenantId, SingleEntityEntitlements<UserId>>;
  tenant_entitlements: SingleEntityEntitlements<TenantId>;
};

export type BundlesSource = Map<string, SingleBundleSource>;
export type FeatureFlagsSource = Map<FeatureKey, FeatureFlag[]>;

export type Sources = {
  entitlements: BundlesSource;
  featureFlags: FeatureFlagsSource;
};
