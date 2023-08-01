import { FeatureId, VendorEntitlementsDto } from '../types';
import { BundlesSource, ExpirationTime, FeatureSource, NO_EXPIRE, UNBUNDLED_SRC_ID } from './types';

export class DtoToCacheSourcesMapper {
  map(dto: VendorEntitlementsDto): BundlesSource {
    const {
      data: { features, entitlements, featureBundles },
    } = dto;

    const bundlesMap: BundlesSource = new Map();
    const unbundledFeaturesIds: Set<FeatureId> = new Set();

    // helper features maps
    const featuresMap: Map<string, FeatureSource> = new Map();
    features.forEach((feat) => {
      const [id, key, permissions] = feat;
      featuresMap.set(id, {
        id,
        key,
        permissions: new Set(permissions || []),
      });
      unbundledFeaturesIds.add(id);
    });

    // initialize bundles map
    featureBundles.forEach((bundle) => {
      const [id, featureIds] = bundle;
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

              // mark feature as bundled
              unbundledFeaturesIds.delete(fId);
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

    // make "dummy" bundle for unbundled features
    bundlesMap.set(UNBUNDLED_SRC_ID, {
      id: UNBUNDLED_SRC_ID,
      user_entitlements: new Map(),
      tenant_entitlements: new Map(),
      features: new Map(
        [...unbundledFeaturesIds.values()].map((fId) => {
          const featSource = featuresMap.get(fId)!;

          return [featSource.key, featSource];
        }),
      ),
    });

    return bundlesMap;
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
}
