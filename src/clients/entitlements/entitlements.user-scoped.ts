import { EntitlementReasons, IsEntitledResult } from './types';
import { IEntity, TEntityWithRoles, tokenTypes } from '../identity/types';
import { EntitlementsCache } from './storage/types';
import { NO_EXPIRE, pickExpTimestamp } from './storage/exp-time.utils';

export type IsEntitledToPermissionInput = { permissionKey: string };
export type IsEntitledToFeatureInput = { featureKey: string };

export class EntitlementsUserScoped<T extends IEntity> {
  private readonly tenantId: string;
  private readonly userId?: string;

  constructor(private readonly entity: TEntityWithRoles<T>, private readonly cache: EntitlementsCache) {
    this.tenantId = entity.tenantId;

    switch (entity.type) {
      case tokenTypes.UserAccessToken:
      case tokenTypes.UserApiToken:
      case tokenTypes.UserToken:
        this.userId = entity.id;
    }
  }

  async isEntitledToFeature(featureKey: string): Promise<IsEntitledResult> {
    const tenantEntitlementExpTime = await this.cache.getFeatureEntitlement(featureKey, this.tenantId);
    const userEntitlementExpTime = this.userId
      ? await this.cache.getFeatureEntitlement(featureKey, this.tenantId, this.userId)
      : undefined;

    const expTimes = [tenantEntitlementExpTime, userEntitlementExpTime].filter((v) => v !== undefined) as number[];

    const expTime = expTimes.length === 0 ? undefined : pickExpTimestamp(expTimes);

    if (expTime === undefined) {
      return {
        result: false,
        reason: EntitlementReasons.MISSING_FEATURE,
      };
    } else if (expTime === NO_EXPIRE || expTime > new Date().getTime()) {
      return {
        result: true,
      };
    } else {
      return {
        result: false,
        reason: EntitlementReasons.BUNDLE_EXPIRED,
      };
    }
  }

  async isEntitledToPermission(permissionKey: string): Promise<IsEntitledResult> {
    if (this.entity.permissions.indexOf(permissionKey) < 0) {
      return {
        result: false,
        reason: EntitlementReasons.MISSING_PERMISSION,
      };
    }

    const features = await this.cache.getLinkedFeatures(permissionKey);

    if (features.size === 0) {
      return { result: true };
    }

    let hasExpired = false;
    for (const feature of features) {
      const isEntitledToFeatureResult = await this.isEntitledToFeature(feature);

      if (isEntitledToFeatureResult.result === true) {
        return {
          result: true,
        };
      } else if (isEntitledToFeatureResult.reason === EntitlementReasons.BUNDLE_EXPIRED) {
        hasExpired = true;
      }
    }

    return {
      result: false,
      reason: hasExpired ? EntitlementReasons.BUNDLE_EXPIRED : EntitlementReasons.MISSING_FEATURE,
    };
  }

  isEntitledTo(featureOrPermission: IsEntitledToPermissionInput): Promise<IsEntitledResult>;
  isEntitledTo(featureOrPermission: IsEntitledToFeatureInput): Promise<IsEntitledResult>;
  async isEntitledTo({
    featureKey,
    permissionKey,
  }: {
    permissionKey?: string;
    featureKey?: string;
  }): Promise<IsEntitledResult> {
    if (featureKey && permissionKey) {
      throw new Error('Cannot check both feature and permission entitlement at the same time.');
    } else if (featureKey !== undefined) {
      return this.isEntitledToFeature(featureKey!);
    } else if (permissionKey !== undefined) {
      return this.isEntitledToPermission(permissionKey!);
    } else {
      throw new Error('Neither feature, nor permission key is provided.');
    }
  }
}
