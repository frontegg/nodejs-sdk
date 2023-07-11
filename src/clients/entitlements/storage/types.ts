import { FeatureKey } from '../types';

export const NO_EXPIRE = -1;
export type ExpirationTime = number | typeof NO_EXPIRE;

export interface EntitlementsCache {
  /**
   * Get the entitlement expiry time for given feature, tenant & user combination.
   */
  getFeatureEntitlement(featKey: FeatureKey, tenantId: string, userId?: string): Promise<number | undefined>;

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
