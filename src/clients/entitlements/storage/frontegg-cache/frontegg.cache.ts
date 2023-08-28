import { ExpirationTime, IEntitlementsCache } from '../types';
import { FeatureKey } from '../../types';
import { ENTITLEMENTS_MAP_KEY, getFeatureEntitlementKey, getPermissionMappingKey } from './frontegg.cache-key.utils';
import { ICacheManager } from '../../../../components/cache/managers';
import { FronteggEntitlementsCacheInitializer } from './frontegg.cache-initializer';

export class FronteggEntitlementsCache implements IEntitlementsCache {
  private readonly cache: ICacheManager<any>;

  constructor(cache: ICacheManager<any>, readonly revision: number) {
    this.cache = cache.forScope(FronteggEntitlementsCache.getCachePrefix(revision));
  }

  static getCachePrefix(revision: number): string {
    return `vendor_entitlements_${revision}_`;
  }

  clear(): Promise<void> {
    return new FronteggEntitlementsCacheInitializer(this).clear();
  }

  async getEntitlementExpirationTime(
    featKey: FeatureKey,
    tenantId: string,
    userId?: string,
  ): Promise<ExpirationTime | undefined> {
    const entitlementKey = getFeatureEntitlementKey(featKey, tenantId, userId);
    const result = await this.cache.map(ENTITLEMENTS_MAP_KEY).get<number>(entitlementKey);

    return result || undefined;
  }

  getLinkedFeatures(permissionKey: string): Promise<Set<string>> {
    return this.cache.collection(getPermissionMappingKey(permissionKey)).getAll<string>();
  }

  shutdown(): Promise<void> {
    return this.cache.close();
  }

  getCacheManager(): ICacheManager<any> {
    return this.cache;
  }
}
