import { FronteggEntitlementsCache } from './frontegg.cache';
import { VendorEntitlementsDto } from '../../types';
import { BundlesSource } from '../types';
import {
  ENTITLEMENTS_MAP_KEY,
  getFeatureEntitlementKey,
  getPermissionMappingKey,
  OFFSET_KEY,
} from './frontegg.cache-key.utils';
import { DtoToCacheSourcesMapper } from '../dto-to-cache-sources.mapper';
import { pickExpTimestamp } from '../exp-time.utils';
import { ICacheManager } from '../../../../components/cache/managers';
import { FronteggCache } from '../../../../components/cache';

export class FronteggEntitlementsCacheInitializer {
  constructor(private readonly cache: ICacheManager<any>) {}

  // TODO: make use of revPrefix !!
  static async initialize(dto: VendorEntitlementsDto): Promise<FronteggEntitlementsCache> {
    const revision = dto.snapshotOffset;

    const cache = await FronteggCache.getInstance();
    const cacheInitializer = new FronteggEntitlementsCacheInitializer(cache);

    const sources = new DtoToCacheSourcesMapper().map(dto);

    await cacheInitializer.setupPermissionsReadModel(sources);
    await cacheInitializer.setupEntitlementsReadModel(sources);
    await cacheInitializer.setupRevisionNumber(revision);

    return new FronteggEntitlementsCache(cache, revision);
  }

  private async setupPermissionsReadModel(src: BundlesSource): Promise<void> {
    for (const singleBundle of src.values()) {
      for (const feature of singleBundle.features.values()) {
        for (const permission of feature.permissions) {
          // set permission => features mapping
          await this.cache.collection(getPermissionMappingKey(permission)).set(feature.key);
        }
      }
    }
  }

  private async setupEntitlementsReadModel(src: BundlesSource): Promise<void> {
    const entitlementsHashMap = this.cache.map(ENTITLEMENTS_MAP_KEY);

    // iterating over bundles..
    for (const singleBundle of src.values()) {
      // iterating over tenant&user entitlements
      for (const [tenantId, usersOfTenantEntitlements] of singleBundle.user_entitlements) {
        // iterating over per-user entitlements
        for (const [userId, expTimes] of usersOfTenantEntitlements) {
          const entitlementExpTime = pickExpTimestamp(expTimes);

          await Promise.all(
            [...singleBundle.features.values()].map((feature) =>
              entitlementsHashMap.set(getFeatureEntitlementKey(feature.key, tenantId, userId), entitlementExpTime),
            ),
          );
        }
      }

      // iterating over tenant entitlements
      for (const [tenantId, expTimes] of singleBundle.tenant_entitlements) {
        for (const feature of singleBundle.features.values()) {
          const entitlementExpTime = pickExpTimestamp(expTimes);

          await entitlementsHashMap.set(getFeatureEntitlementKey(feature.key, tenantId), entitlementExpTime);
        }
      }
    }
  }

  private async setupRevisionNumber(revision: number): Promise<void> {
    await this.cache.set(OFFSET_KEY, revision);
  }
}
