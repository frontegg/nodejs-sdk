import { EntitlementsCache, ExpirationTime, NO_EXPIRE } from '../types';
import {
  EntitlementTuple,
  FeatureBundleTuple,
  FeatureTuple,
  FeatureKey,
  TenantId,
  UserId,
  VendorEntitlementsDto,
} from '../../types';
import {
  ENTITLEMENTS_MAP_KEY,
  PERMISSIONS_MAP_KEY,
  SRC_BUNDLES_KEY,
  getFeatureEntitlementKey,
} from './in-memory.cache-key.utils';
import NodeCache = require('node-cache');
import { pickExpTimestamp } from '../exp-time.utils';
import { BundlesSource, EntitlementsMap, FeatureSource, PermissionsMap } from './types';
import { Permission } from '../../../identity/types';

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

  static initialize(data: VendorEntitlementsDto, revPrefix?: string): InMemoryEntitlementsCache {
    const cache = new InMemoryEntitlementsCache(revPrefix ?? data.snapshotOffset.toString());

    const {
      data: { features, entitlements, featureBundles },
    } = data;

    // build source structure
    const sourceData = cache.buildSource(featureBundles, features, entitlements);
    cache.nodeCache.set(SRC_BUNDLES_KEY, sourceData);

    // setup data for SDK to work
    cache.setupEntitlementsReadModel(sourceData);
    cache.setupPermissionsReadModel(sourceData);

    return cache;
  }

  private buildSource(
    bundles: FeatureBundleTuple[],
    features: FeatureTuple[],
    entitlements: EntitlementTuple[],
  ): BundlesSource {
    const bundlesMap: BundlesSource = new Map();

    // helper features map
    const featuresMap: Map<string, FeatureSource> = new Map();
    features.forEach((feat) => {
      const [id, key, permissions] = feat;
      featuresMap.set(id, {
        id,
        key,
        permissions: new Set(permissions || []),
      });
    });

    // initialize bundles map
    bundles.forEach((bundle) => {
      const [id, , featureIds] = bundle;
      bundlesMap.set(id, {
        id,
        user_entitlements: new Map(),
        tenant_entitlements: new Map(),
        features: new Map(
          featureIds.reduce<Array<[string, FeatureSource]>>((prev, fId) => {
            const featSource = featuresMap.get(fId);

            if (!featSource) {
              // TODO: issue warning here!
            } else {
              prev.push([featSource.key, featSource]);
            }

            return prev;
          }, []),
        ),
      });
    });

    // fill bundles with entitlements
    entitlements.forEach((entitlement) => {
      const [featureBundleId, tenantId, userId, expirationDate] = entitlement;
      const bundle = bundlesMap.get(featureBundleId);

      if (bundle) {
        if (userId) {
          // that's user-targeted entitlement
          const tenantUserEntitlements = this.ensureMapInMap(bundle.user_entitlements, tenantId);
          const usersEntitlements = this.ensureArrayInMap(tenantUserEntitlements, userId);

          usersEntitlements.push(this.parseExpirationTime(expirationDate));
        } else {
          // that's tenant-targeted entitlement
          const tenantEntitlements = this.ensureArrayInMap(bundle.tenant_entitlements, tenantId);

          tenantEntitlements.push(this.parseExpirationTime(expirationDate));
        }
      } else {
        // TODO: issue warning here!
      }
    });

    return bundlesMap;
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
          this.ensureSetInMap(permissionsReadModel, permission).add(feature.key);
        });
      });
    });

    this.nodeCache.set(PERMISSIONS_MAP_KEY, permissionsReadModel);
  }

  private ensureSetInMap<K, T>(map: Map<K, Set<T>>, mapKey: K): Set<T> {
    if (!map.has(mapKey)) {
      map.set(mapKey, new Set());
    }

    return map.get(mapKey)!;
  }

  private ensureMapInMap<K, T extends Map<any, any>>(map: Map<K, T>, mapKey: K): T {
    if (!map.has(mapKey)) {
      map.set(mapKey, new Map() as T);
    }

    return map.get(mapKey)!;
  }

  private ensureArrayInMap<K, T>(map: Map<K, T[]>, mapKey: K): T[] {
    if (!map.has(mapKey)) {
      map.set(mapKey, []);
    }

    return map.get(mapKey)!;
  }

  private parseExpirationTime(time?: string | null): ExpirationTime {
    if (time !== undefined && time !== null) {
      return new Date(time).getTime();
    }

    return NO_EXPIRE;
  }

  async clear(): Promise<void> {
    this.nodeCache.del(this.nodeCache.keys());
  }

  async shutdown(): Promise<void> {
    this.nodeCache.close();
  }
}
