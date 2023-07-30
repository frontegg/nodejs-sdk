import { FeatureKey, TenantId, UserId } from '../types';
import { Permission } from '../../identity/types';

export const NO_EXPIRE = -1;
export type ExpirationTime = number | typeof NO_EXPIRE;

export interface IEntitlementsCache {

  /**
   * The revision number to compare next entitlements cache versions.
   */
  revision: number;

  /**
   * Get the entitlement expiry time for given feature, tenant & user combination.
   */
  getEntitlementExpirationTime(
    featKey: FeatureKey,
    tenantId: string,
    userId?: string,
  ): Promise<ExpirationTime | undefined>;

  /**
   * Get all features with linked permission.
   */
  getLinkedFeatures(permissionKey: string): Promise<Set<string>>;

  /**
   * Remove all cached data.
   */
  clear(): Promise<void>;

  /**
   * Gracefully shutdown the cache instance.
   */
  shutdown(): Promise<void>;
}

export const UNBUNDLED_SRC_ID = '__unbundled__';
export type FeatureEntitlementKey = string; // tenant & user & feature key
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