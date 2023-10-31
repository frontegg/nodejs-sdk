import { FeatureKey } from '../../types';

export const ENTITLEMENTS_MAP_KEY = 'entitlements';
export const PERMISSIONS_MAP_KEY = 'permissions';
export const FEAT_TO_FLAG_MAP_KEY = 'feats_to_flags';
export const SRC_BUNDLES_KEY = 'src_bundles';
export const SRC_FEATURE_FLAGS = 'src_feature_flags';

export function getFeatureEntitlementKey(featKey: FeatureKey, tenantId: string, userId = ''): string {
  return `${tenantId}:${userId}:${featKey}`;
}
