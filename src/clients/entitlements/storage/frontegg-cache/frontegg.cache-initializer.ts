import { FronteggEntitlementsCache } from './frontegg.cache';
import { VendorEntitlementsDto } from '../../types';
import { BundlesSource } from '../types';
import {
  ENTITLEMENTS_MAP_KEY,
  getFeatureEntitlementKey,
  getPermissionMappingKey,
  OFFSET_KEY,
  PERMISSIONS_COLLECTION_LIST,
} from './frontegg.cache-key.utils';
import { DtoToCacheSourcesMapper } from '../dto-to-cache-sources.mapper';
import { pickExpTimestamp } from '../exp-time.utils';
import { FronteggCache } from '../../../../components/cache';

export class FronteggEntitlementsCacheInitializer {
  static readonly CLEAR_TTL = 60 * 60 * 1000;

  constructor(private readonly entitlementsCache: FronteggEntitlementsCache) {}

  static async forLeader(dto: VendorEntitlementsDto): Promise<FronteggEntitlementsCache> {
    const revision = dto.snapshotOffset;

    const cache = await FronteggCache.getInstance();
    const entitlementsCache = new FronteggEntitlementsCache(cache, revision);

    const cacheInitializer = new FronteggEntitlementsCacheInitializer(entitlementsCache);

    const sources = new DtoToCacheSourcesMapper().map(dto);

    await cacheInitializer.setupPermissionsReadModel(sources);
    await cacheInitializer.setupEntitlementsReadModel(sources);
    await cacheInitializer.setupRevisionNumber(revision);

    return entitlementsCache;
  }

  static async forFollower(revision: number): Promise<FronteggEntitlementsCache> {
    return new FronteggEntitlementsCache(await FronteggCache.getInstance(), revision);
  }

  private async setupPermissionsReadModel(src: BundlesSource): Promise<void> {
    const cache = this.entitlementsCache.getCacheManager();
    const permissionsList = cache.collection(PERMISSIONS_COLLECTION_LIST);

    for (const singleBundle of src.values()) {
      for (const feature of singleBundle.features.values()) {
        for (const permission of feature.permissions) {
          // set permission => features mapping
          await cache.collection(getPermissionMappingKey(permission)).set(feature.key);

          // add permission to the list
          await permissionsList.set(permission);
        }
      }
    }
  }

  private async setupEntitlementsReadModel(src: BundlesSource): Promise<void> {
    const entitlementsHashMap = this.entitlementsCache.getCacheManager().map(ENTITLEMENTS_MAP_KEY);

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
    await this.entitlementsCache.getCacheManager().set(OFFSET_KEY, revision);
  }

  async clear(): Promise<void> {
    const cache = this.entitlementsCache.getCacheManager();

    // clear permissions maps
    const allPermissions = await cache.collection(PERMISSIONS_COLLECTION_LIST).getAll<string>();

    for (const permission of allPermissions) {
      await cache.expire([ getPermissionMappingKey(permission)], FronteggEntitlementsCacheInitializer.CLEAR_TTL);
    }

    // clear static fields
    await cache.expire(
      [PERMISSIONS_COLLECTION_LIST, ENTITLEMENTS_MAP_KEY],
      FronteggEntitlementsCacheInitializer.CLEAR_TTL,
    );
  }
}
