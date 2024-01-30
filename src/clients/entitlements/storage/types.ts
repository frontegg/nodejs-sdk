import { FeatureKey } from '../types';
import { FeatureFlag, Plan } from '@frontegg/entitlements-javascript-commons';

export const NO_EXPIRE = -1;
export type ExpirationTime = number | typeof NO_EXPIRE;

export interface EntitlementsCache {
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
   * Get all feature-flags with given feature configured.
   */
  getFeatureFlags(featureKey: string): Promise<FeatureFlag[]>;

  /**
   * Get all plans with given feature configured
   */
  getPlans(featureKey: string): Promise<Plan[]>;

  /**
   * Remove all cached data.
   */
  clear(): Promise<void>;

  /**
   * Gracefully shutdown the cache instance.
   */
  shutdown(): Promise<void>;
}
