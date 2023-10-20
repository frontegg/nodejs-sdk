import { EntitlementsCache, ExpirationTime } from '../types';
import { FeatureKey, TenantId, UserId } from '../../types';
import {
  ENTITLEMENTS_MAP_KEY,
  PERMISSIONS_MAP_KEY,
  SRC_BUNDLES_KEY,
  FEAT_TO_FLAG_MAP_KEY,
  getFeatureEntitlementKey,
} from './in-memory.cache-key.utils';
import NodeCache = require('node-cache');
import { pickExpTimestamp } from '../exp-time.utils';
import { BundlesSource, EntitlementsMap, FeatureFlagsSource, PermissionsMap } from './types';
import { Permission } from '../../../identity/types';
import { DTO } from '@frontegg/entitlements-service-types';
import { FeatureFlag } from '@frontegg/entitlements-javascript-commons/dist/feature-flags/types';
import { SourcesMapper } from './mappers/sources.mapper';
import { ensureSetInMap } from './mappers/helper';

export class InMemoryEntitlementsCache implements EntitlementsCache {
  private nodeCache: NodeCache;

  private constructor(readonly revision: string) {
    this.nodeCache = new NodeCache({
      useClones: false,
      errorOnMissing: true,
    });
  }

  async getEntitlementExpirationTime(
    featKey: FeatureKey,
    tenantId: TenantId,
    userId?: UserId,
  ): Promise<ExpirationTime | undefined> {
    const entitlementsMap = this.nodeCache.get<EntitlementsMap>(ENTITLEMENTS_MAP_KEY);
    if (!entitlementsMap) {
      throw new Error('Cache is not properly initialized. Feature&Tenant&User => ExpirationTime map is missing.');
    }

    const entitlementKey = getFeatureEntitlementKey(featKey, tenantId, userId);

    return entitlementsMap.get(entitlementKey);
  }

  async getLinkedFeatures(permissionKey: Permission): Promise<Set<string>> {
    const permissionsMap = this.nodeCache.get<PermissionsMap>(PERMISSIONS_MAP_KEY);
    if (!permissionsMap) {
      throw new Error('Cache is not properly initialized. Permissions => Features map is missing.');
    }

    const mapping = permissionsMap.get(permissionKey);

    return mapping || new Set();
  }

  async getFeatureFlags(featureKey: string): Promise<FeatureFlag[]> {
    return this.nodeCache.get<FeatureFlagsSource>(FEAT_TO_FLAG_MAP_KEY)?.get(featureKey) || [];
  }

  static initialize(data: DTO.VendorEntitlementsV1.GetDTO, revPrefix?: string): InMemoryEntitlementsCache {
    const cache = new InMemoryEntitlementsCache(revPrefix ?? data.snapshotOffset.toString());

    // build source structure
    const { entitlements: e10sSourceData, featureFlags: ffSourceData } = new SourcesMapper(data.data).buildSources();

    cache.nodeCache.set(SRC_BUNDLES_KEY, e10sSourceData);

    // setup data for SDK to work
    cache.setupEntitlementsReadModel(e10sSourceData);
    cache.setupPermissionsReadModel(e10sSourceData);
    cache.setupFeatureFlagsReadModel(ffSourceData);

    return cache;
  }

  private setupEntitlementsReadModel(src: BundlesSource): void {
    const entitlementsReadModel: EntitlementsMap = new Map();

    // iterating over bundles..
    src.forEach((singleBundle) => {
      // iterating over tenant&user entitlements
      singleBundle.user_entitlements.forEach((usersOfTenantEntitlements, tenantId) => {
        // iterating over per-user entitlements
        usersOfTenantEntitlements.forEach((expTimes, userId) => {
          const entitlementExpTime = pickExpTimestamp(expTimes);

          singleBundle.features.forEach((feature) => {
            entitlementsReadModel.set(getFeatureEntitlementKey(feature.key, tenantId, userId), entitlementExpTime);
          });
        });
      });

      // iterating over tenant entitlements
      singleBundle.tenant_entitlements.forEach((expTimes, tenantId) => {
        singleBundle.features.forEach((feature) => {
          const entitlementExpTime = pickExpTimestamp(expTimes);

          entitlementsReadModel.set(getFeatureEntitlementKey(feature.key, tenantId), entitlementExpTime);
        });
      });
    });

    this.nodeCache.set(ENTITLEMENTS_MAP_KEY, entitlementsReadModel);
  }

  private setupPermissionsReadModel(src: BundlesSource): void {
    const permissionsReadModel: Map<string, Set<string>> = new Map();

    src.forEach((singleBundle) => {
      singleBundle.features.forEach((feature) => {
        feature.permissions.forEach((permission) => {
          ensureSetInMap(permissionsReadModel, permission).add(feature.key);
        });
      });
    });

    this.nodeCache.set(PERMISSIONS_MAP_KEY, permissionsReadModel);
  }

  private setupFeatureFlagsReadModel(src: FeatureFlagsSource): void {
    this.nodeCache.set(FEAT_TO_FLAG_MAP_KEY, src);
  }

  async clear(): Promise<void> {
    this.nodeCache.del(this.nodeCache.keys());
  }

  async shutdown(): Promise<void> {
    this.nodeCache.close();
  }
}
