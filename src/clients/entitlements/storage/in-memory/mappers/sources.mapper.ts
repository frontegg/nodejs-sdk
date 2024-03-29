import type { EntitlementTuple, FeatureBundleTuple, FeatureId, FeatureTuple } from '../../../types';
import { BundlesSource, FeatureFlagsSource, FeatureSource, PlansSource, Sources, UNBUNDLED_SRC_ID } from '../types';
import type { VendorEntitlementsV1 } from '../../../api-types';
import type { FeatureFlagTuple } from '../../../types';
import { mapFromTuple } from './feature-flag-tuple.mapper';
import { mapFromTuple as mapPlanFromTuple } from './plan-tuple.mapper';
import { ExpirationTime, NO_EXPIRE } from '../../types';
import { ensureArrayInMap, ensureMapInMap } from './helper';

export class SourcesMapper {
  constructor(private readonly dto: VendorEntitlementsV1.GetDTO['data']) {}

  buildSources(): Sources {
    return {
      entitlements: this.buildEntitlementsSources(this.dto.featureBundles, this.dto.features, this.dto.entitlements),
      featureFlags: this.buildFeatureFlagsSources(this.dto.featureFlags, this.dto.features),
      plans: this.buildPlansSources(this.dto.featureBundles, this.dto.features),
    };
  }

  private buildEntitlementsSources(
    bundles: FeatureBundleTuple[],
    features: FeatureTuple[],
    entitlements: EntitlementTuple[],
  ): BundlesSource {
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
    bundles.forEach((bundle) => {
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
          const tenantUserEntitlements = ensureMapInMap(bundle.user_entitlements, tenantId);
          const usersEntitlements = ensureArrayInMap(tenantUserEntitlements, userId);

          usersEntitlements.push(this.parseExpirationTime(expirationDate));
        } else {
          // that's tenant-targeted entitlement
          const tenantEntitlements = ensureArrayInMap(bundle.tenant_entitlements, tenantId);

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

  private buildFeatureFlagsSources(flags: FeatureFlagTuple[], features: FeatureTuple[]): FeatureFlagsSource {
    const featureKeys = features.map((tuple) => tuple[1]);
    const source: FeatureFlagsSource = new Map();

    flags.forEach((flagTuple) => {
      const featureKey = flagTuple[0];

      if (featureKeys.includes(featureKey)) {
        ensureArrayInMap(source, featureKey).push(mapFromTuple(flagTuple));
      }
    }, []);

    return source;
  }

  private parseExpirationTime(time?: string | null): ExpirationTime {
    if (time !== undefined && time !== null) {
      return new Date(time).getTime();
    }

    return NO_EXPIRE;
  }
  private buildPlansSources(bundles: FeatureBundleTuple[], features: FeatureTuple[]): PlansSource {
    const source: PlansSource = new Map();
    const featureIdToFeatureKeyMap = new Map<string, string>();

    features.forEach(([featureId, featureKey]) => {
      featureIdToFeatureKeyMap.set(featureId, featureKey);
    });

    bundles.forEach((tuple) => {
      const featureIds = tuple[1];
      featureIds.forEach((featureId) => {
        const featureKey = featureIdToFeatureKeyMap.get(featureId);
        ensureArrayInMap(source, featureKey).push(mapPlanFromTuple(tuple));
      });
    });

    return source;
  }
}
