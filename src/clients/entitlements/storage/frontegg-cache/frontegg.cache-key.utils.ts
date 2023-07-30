import { FeatureKey } from '../../types';
import { Permission } from '../../../identity/types';

export const ENTITLEMENTS_MAP_KEY = 'entitlements';
export const OFFSET_KEY = 'snapshot-offset'

export function getFeatureEntitlementKey(featKey: FeatureKey, tenantId: string, userId = ''): string {
  return `${tenantId}:${userId}:${featKey}`;
}

export function getPermissionMappingKey(permissionKey: Permission): string {
  return `perms:${permissionKey}`;
}