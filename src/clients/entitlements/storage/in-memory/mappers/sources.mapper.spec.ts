import { SourcesMapper } from './sources.mapper';
import { UNBUNDLED_SRC_ID } from '../types';
import { NO_EXPIRE } from '../../types';
import type { VendorEntitlementsV1 } from '../../../api-types';
import type { FeatureTuple, FeatureBundleTuple, EntitlementTuple, FeatureFlagTuple } from '../../../types';

function makeDto(
  overrides: Partial<VendorEntitlementsV1.GetDTO['data']> = {},
): VendorEntitlementsV1.GetDTO['data'] {
  return {
    features: [],
    featureBundles: [],
    entitlements: [],
    featureFlags: [],
    ...overrides,
  };
}

describe('SourcesMapper', () => {
  describe('buildSources', () => {
    it('returns { entitlements, featureFlags, plans }', () => {
      const mapper = new SourcesMapper(makeDto());
      const sources = mapper.buildSources();

      expect(sources).toHaveProperty('entitlements');
      expect(sources).toHaveProperty('featureFlags');
      expect(sources).toHaveProperty('plans');
    });
  });

  describe('entitlements', () => {
    it('maps bundles correctly with features grouped into bundles', () => {
      const features: FeatureTuple[] = [
        ['f1', 'feature-one', ['perm1']],
        ['f2', 'feature-two', []],
      ];
      const bundles: FeatureBundleTuple[] = [['b1', ['f1', 'f2'], 'true', []]];

      const mapper = new SourcesMapper(makeDto({ features, featureBundles: bundles }));
      const sources = mapper.buildSources();

      const bundle = sources.entitlements.get('b1');
      expect(bundle).toBeDefined();
      expect(bundle!.id).toBe('b1');
      expect(bundle!.features.size).toBe(2);
      expect(bundle!.features.get('feature-one')).toEqual({
        id: 'f1',
        key: 'feature-one',
        permissions: new Set(['perm1']),
      });
      expect(bundle!.features.get('feature-two')).toEqual({
        id: 'f2',
        key: 'feature-two',
        permissions: new Set(),
      });
    });

    it('puts unbundled features into UNBUNDLED_SRC_ID bundle', () => {
      const features: FeatureTuple[] = [
        ['f1', 'feature-one', []],
        ['f2', 'feature-two', []],
      ];
      const bundles: FeatureBundleTuple[] = [['b1', ['f1'], 'true', []]];

      const mapper = new SourcesMapper(makeDto({ features, featureBundles: bundles }));
      const sources = mapper.buildSources();

      const unbundled = sources.entitlements.get(UNBUNDLED_SRC_ID);
      expect(unbundled).toBeDefined();
      expect(unbundled!.features.has('feature-two')).toBe(true);
      expect(unbundled!.features.has('feature-one')).toBe(false);
    });

    it('maps tenant-targeted entitlements (no userId)', () => {
      const features: FeatureTuple[] = [['f1', 'feat', []]];
      const bundles: FeatureBundleTuple[] = [['b1', ['f1'], 'true', []]];
      const entitlements: EntitlementTuple[] = [['b1', 'tenant-1', undefined, undefined]];

      const mapper = new SourcesMapper(makeDto({ features, featureBundles: bundles, entitlements }));
      const sources = mapper.buildSources();

      const bundle = sources.entitlements.get('b1')!;
      expect(bundle.tenant_entitlements.get('tenant-1')).toEqual([NO_EXPIRE]);
    });

    it('maps user-targeted entitlements (with userId)', () => {
      const features: FeatureTuple[] = [['f1', 'feat', []]];
      const bundles: FeatureBundleTuple[] = [['b1', ['f1'], 'true', []]];
      const entitlements: EntitlementTuple[] = [['b1', 'tenant-1', 'user-1', undefined]];

      const mapper = new SourcesMapper(makeDto({ features, featureBundles: bundles, entitlements }));
      const sources = mapper.buildSources();

      const bundle = sources.entitlements.get('b1')!;
      const tenantUsers = bundle.user_entitlements.get('tenant-1');
      expect(tenantUsers).toBeDefined();
      expect(tenantUsers!.get('user-1')).toEqual([NO_EXPIRE]);
    });
  });

  describe('parseExpirationTime', () => {
    it('returns NO_EXPIRE for undefined expiration date', () => {
      const features: FeatureTuple[] = [['f1', 'feat', []]];
      const bundles: FeatureBundleTuple[] = [['b1', ['f1'], 'true', []]];
      const entitlements: EntitlementTuple[] = [['b1', 't1', undefined, undefined]];

      const mapper = new SourcesMapper(makeDto({ features, featureBundles: bundles, entitlements }));
      const sources = mapper.buildSources();

      expect(sources.entitlements.get('b1')!.tenant_entitlements.get('t1')).toEqual([NO_EXPIRE]);
    });

    it('returns timestamp for date string', () => {
      const dateStr = '2025-01-15T00:00:00.000Z';
      const features: FeatureTuple[] = [['f1', 'feat', []]];
      const bundles: FeatureBundleTuple[] = [['b1', ['f1'], 'true', []]];
      const entitlements: EntitlementTuple[] = [['b1', 't1', undefined, dateStr]];

      const mapper = new SourcesMapper(makeDto({ features, featureBundles: bundles, entitlements }));
      const sources = mapper.buildSources();

      expect(sources.entitlements.get('b1')!.tenant_entitlements.get('t1')).toEqual([
        new Date(dateStr).getTime(),
      ]);
    });
  });

  describe('featureFlags', () => {
    it('maps feature flags using mapFromTuple for known features', () => {
      const features: FeatureTuple[] = [['f1', 'feat-key', []]];
      const featureFlags: FeatureFlagTuple[] = [
        ['feat-key', true, 'boolean', 'true', 'false', []],
      ];

      const mapper = new SourcesMapper(makeDto({ features, featureFlags }));
      const sources = mapper.buildSources();

      const flags = sources.featureFlags.get('feat-key');
      expect(flags).toBeDefined();
      expect(flags!.length).toBe(1);
      expect(flags![0]).toMatchObject({
        on: true,
        defaultTreatment: 'true',
        offTreatment: 'false',
      });
    });

    it('ignores feature flags for unknown features', () => {
      const features: FeatureTuple[] = [['f1', 'known-key', []]];
      const featureFlags: FeatureFlagTuple[] = [
        ['unknown-key', true, 'boolean', 'true', 'false', []],
      ];

      const mapper = new SourcesMapper(makeDto({ features, featureFlags }));
      const sources = mapper.buildSources();

      expect(sources.featureFlags.has('unknown-key')).toBe(false);
    });
  });

  describe('plans', () => {
    it('builds plans from bundles', () => {
      const features: FeatureTuple[] = [
        ['f1', 'feat-1', []],
        ['f2', 'feat-2', []],
      ];
      const bundles: FeatureBundleTuple[] = [['b1', ['f1', 'f2'], 'true', []]];

      const mapper = new SourcesMapper(makeDto({ features, featureBundles: bundles }));
      const sources = mapper.buildSources();

      const plansForFeat1 = sources.plans.get('feat-1');
      expect(plansForFeat1).toBeDefined();
      expect(plansForFeat1!.length).toBe(1);
      expect(plansForFeat1![0]).toMatchObject({ defaultTreatment: 'true', rules: [] });

      const plansForFeat2 = sources.plans.get('feat-2');
      expect(plansForFeat2).toBeDefined();
      expect(plansForFeat2!.length).toBe(1);
    });
  });
});
