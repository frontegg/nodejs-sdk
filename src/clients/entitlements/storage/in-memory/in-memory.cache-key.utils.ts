import { FeatureKey } from '../../types';

export const ENTITLEMENTS_MAP_KEY = 'entitlements';
export const PERMISSIONS_MAP_KEY = 'permissions';
export const SRC_BUNDLES_KEY = 'src_bundles';

export function getFeatureEntitlementKey(featKey: FeatureKey, tenantId: string, userId: string = ''): string {
  return `${tenantId}:${userId}:${featKey}`;
}
