import { ExpirationTime, IEntitlementsCache } from '../types';
import { FeatureKey } from '../../types';
import { ENTITLEMENTS_MAP_KEY, getFeatureEntitlementKey, getPermissionMappingKey } from './frontegg.cache-key.utils';
import { ICacheManager } from '../../../../components/cache/managers';

export class FronteggEntitlementsCache implements IEntitlementsCache {

  constructor(
    private readonly cache: ICacheManager<any>, readonly revision: number
  ) {
  }

  clear(): Promise<void> {
    return Promise.resolve(undefined);
  }

  async getEntitlementExpirationTime(featKey: FeatureKey, tenantId: string, userId?: string): Promise<ExpirationTime | undefined> {
    const entitlementKey = getFeatureEntitlementKey(featKey, tenantId, userId);
    const result = await this.cache.map(ENTITLEMENTS_MAP_KEY).get<number>(entitlementKey);

    return result || undefined;
  }

  getLinkedFeatures(permissionKey: string): Promise<Set<string>> {
    return this.cache.collection(getPermissionMappingKey(permissionKey)).getAll<string>();
  }

  shutdown(): Promise<void> {
    return Promise.resolve(undefined);
  }

}