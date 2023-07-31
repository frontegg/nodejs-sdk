import { EntitlementJustifications, IsEntitledResult } from './types';
import { IEntityWithRoles, Permission, TEntity, tokenTypes, TUserEntity } from '../identity/types';
import { EntitlementsCache, NO_EXPIRE } from './storage/types';
import { pickExpTimestamp } from './storage/exp-time.utils';

export type IsEntitledToPermissionInput = { permissionKey: string };
export type IsEntitledToFeatureInput = { featureKey: string };

export class EntitlementsUserScoped<T extends TEntity = TEntity> {
  private readonly tenantId: string;
  private readonly userId?: string;
  private readonly permissions: Permission[];

  constructor(private readonly entity: T, private readonly cache: EntitlementsCache) {
    this.tenantId = entity.tenantId;

    const entityWithUserId = entity as TUserEntity;
    this.userId = this.findUserId(entityWithUserId);

    const entityWithPossiblePermissions = entity as IEntityWithRoles;
    if (Array.isArray(entityWithPossiblePermissions.permissions)) {
      this.permissions = entityWithPossiblePermissions.permissions;
    } else {
      this.permissions = [];
    }
  }

  private findUserId(entity: TUserEntity): string | undefined {
    switch (entity.type) {
      case tokenTypes.UserToken:
        return entity.sub;
      case tokenTypes.UserApiToken:
      case tokenTypes.UserAccessToken:
        return entity.userId;
    }
  }

  async isEntitledToFeature(featureKey: string): Promise<IsEntitledResult> {
    const tenantEntitlementExpTime = await this.cache.getEntitlementExpirationTime(featureKey, this.tenantId);
    const userEntitlementExpTime = this.userId
      ? await this.cache.getEntitlementExpirationTime(featureKey, this.tenantId, this.userId)
      : undefined;

    const expTimes = [tenantEntitlementExpTime, userEntitlementExpTime].filter((v) => v !== undefined) as number[];

    const expTime = expTimes.length === 0 ? undefined : pickExpTimestamp(expTimes);

    if (expTime === undefined) {
      return {
        result: false,
        justification: EntitlementJustifications.MISSING_FEATURE,
      };
    } else if (expTime === NO_EXPIRE || expTime > new Date().getTime()) {
      return {
        result: true,
      };
    } else {
      return {
        result: false,
        justification: EntitlementJustifications.BUNDLE_EXPIRED,
      };
    }
  }

  async isEntitledToPermission(permissionKey: string): Promise<IsEntitledResult> {
    if (this.permissions === undefined || this.permissions.indexOf(permissionKey) < 0) {
      return {
        result: false,
        justification: EntitlementJustifications.MISSING_PERMISSION,
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
      } else if (isEntitledToFeatureResult.justification === EntitlementJustifications.BUNDLE_EXPIRED) {
        hasExpired = true;
      }
    }

    return {
      result: false,
      justification: hasExpired ? EntitlementJustifications.BUNDLE_EXPIRED : EntitlementJustifications.MISSING_FEATURE,
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
