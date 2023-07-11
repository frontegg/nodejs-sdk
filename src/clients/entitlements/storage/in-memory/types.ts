import { Permission } from '../../../identity/types';
import { FeatureKey, TenantId, UserId } from '../../types';
import { ExpirationTime } from '../types';

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
