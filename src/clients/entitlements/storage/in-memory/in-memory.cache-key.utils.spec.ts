import {
  getFeatureEntitlementKey,
  ENTITLEMENTS_MAP_KEY,
  PERMISSIONS_MAP_KEY,
  FEAT_TO_FLAG_MAP_KEY,
  SRC_BUNDLES_KEY,
  SRC_FEATURE_FLAGS,
  SRC_PLANS,
} from './in-memory.cache-key.utils';

describe('getFeatureEntitlementKey', () => {
  it("returns '{tenantId}:{userId}:{featKey}'", () => {
    expect(getFeatureEntitlementKey('feat-1', 'tenant-1', 'user-1')).toBe('tenant-1:user-1:feat-1');
  });

  it("returns '{tenantId}::{featKey}' with no userId", () => {
    expect(getFeatureEntitlementKey('feat-1', 'tenant-1')).toBe('tenant-1::feat-1');
  });

  it("returns '{tenantId}::{featKey}' with explicit empty userId", () => {
    expect(getFeatureEntitlementKey('feat-1', 'tenant-1', '')).toBe('tenant-1::feat-1');
  });
});

describe('constants', () => {
  it('exports ENTITLEMENTS_MAP_KEY', () => {
    expect(ENTITLEMENTS_MAP_KEY).toBe('entitlements');
  });

  it('exports PERMISSIONS_MAP_KEY', () => {
    expect(PERMISSIONS_MAP_KEY).toBe('permissions');
  });

  it('exports FEAT_TO_FLAG_MAP_KEY', () => {
    expect(FEAT_TO_FLAG_MAP_KEY).toBe('feats_to_flags');
  });

  it('exports SRC_BUNDLES_KEY', () => {
    expect(SRC_BUNDLES_KEY).toBe('src_bundles');
  });

  it('exports SRC_FEATURE_FLAGS', () => {
    expect(SRC_FEATURE_FLAGS).toBe('src_feature_flags');
  });

  it('exports SRC_PLANS', () => {
    expect(SRC_PLANS).toBe('src_plans');
  });
});
