import { EntitlementJustifications, IsEntitledResult } from './types';
import { IEntityWithRoles, Permission, TEntity, TUserEntity } from '../identity/types';
import { EntitlementsCache, NO_EXPIRE } from './storage/types';
import { pickExpTimestamp } from './storage/exp-time.utils';
import {
  createPermissionCheckRegex,
  CustomAttributes,
  evaluateFeatureFlag,
  evaluatePlan,
  TreatmentEnum,
} from '@frontegg/entitlements-javascript-commons';
import { findUserId } from './helpers/frontegg-entity.helper';

export type IsEntitledToPermissionInput = { permissionKey: string };
export type IsEntitledToFeatureInput = { featureKey: string };

export class EntitlementsUserScoped<T extends TEntity = TEntity> {
  private readonly tenantId: string;
  private readonly userId?: string;
  private readonly permissions: Permission[] = [];
  private readonly permissionRegexps: RegExp[] = [];

  constructor(
    private readonly entity: T,
    private readonly cache: EntitlementsCache,
    private readonly predefinedAttributes: CustomAttributes = {},
  ) {
    this.tenantId = entity.tenantId;
    this.userId = findUserId(entity as TUserEntity);

    const entityWithPossiblePermissions = entity as IEntityWithRoles;
    if (Array.isArray(entityWithPossiblePermissions.permissions)) {
      entityWithPossiblePermissions.permissions.forEach((permission) => {
        if (permission.includes('*')) {
          this.permissionRegexps.push(createPermissionCheckRegex(permission));
        } else {
          this.permissions.push(permission);
        }
      });
    }
  }

  async isEntitledToFeature(featureKey: string, attributes: CustomAttributes = {}): Promise<IsEntitledResult> {
    const isEntitledResult = await this.getEntitlementResult(featureKey);

    if (!isEntitledResult.result) {
      const ffResult = await this.getFeatureFlagResult(featureKey, { ...attributes, ...this.predefinedAttributes });

      if (ffResult.result) {
        return ffResult;
      }

      const targetingRulesResult = await this.getPlanTargetingRulesResult(featureKey, {
        ...attributes,
        ...this.predefinedAttributes,
      });

      if (targetingRulesResult.result) {
        return targetingRulesResult;
      }
      // else: just return result & justification of entitlements
    }

    return isEntitledResult;
  }

  private async getEntitlementResult(featureKey: string): Promise<IsEntitledResult> {
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

  private async getFeatureFlagResult(featureKey: string, attributes: Record<string, any>): Promise<IsEntitledResult> {
    const featureFlags = await this.cache.getFeatureFlags(featureKey);

    for (const flag of featureFlags) {
      const ffResult = evaluateFeatureFlag(flag, attributes);
      if (ffResult?.treatment === TreatmentEnum.True) {
        return { result: true };
      }
    }

    return {
      result: false,
      justification: EntitlementJustifications.MISSING_FEATURE,
    };
  }

  private async getPlanTargetingRulesResult(
    featureKey: string,
    attributes: Record<string, any>,
  ): Promise<IsEntitledResult> {
    const plans = await this.cache.getPlans(featureKey);
    for (const plan of plans) {
      const planTargetingRulesResult = evaluatePlan(plan, attributes);
      if (planTargetingRulesResult.treatment === TreatmentEnum.True) {
        return { result: true };
      }
    }

    return {
      result: false,
      justification: EntitlementJustifications.MISSING_FEATURE,
    };
  }

  private hasPermission(permissionKey: string): boolean {
    return (
      this.permissions.includes(permissionKey) || this.permissionRegexps.some((regex) => regex.test(permissionKey))
    );
  }

  async isEntitledToPermission(permissionKey: string, attributes: CustomAttributes = {}): Promise<IsEntitledResult> {
    if (!this.hasPermission(permissionKey)) {
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
      const isEntitledToFeatureResult = await this.isEntitledToFeature(feature, attributes);

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

  isEntitledTo(
    featureOrPermission: IsEntitledToPermissionInput,
    attributes?: Record<string, any>,
  ): Promise<IsEntitledResult>;
  isEntitledTo(
    featureOrPermission: IsEntitledToFeatureInput,
    attributes?: Record<string, any>,
  ): Promise<IsEntitledResult>;
  async isEntitledTo(
    {
      featureKey,
      permissionKey,
    }: {
      permissionKey?: string;
      featureKey?: string;
    },
    attributes: CustomAttributes = {},
  ): Promise<IsEntitledResult> {
    if (featureKey && permissionKey) {
      throw new Error('Cannot check both feature and permission entitlement at the same time.');
    } else if (featureKey !== undefined) {
      return this.isEntitledToFeature(featureKey!, attributes);
    } else if (permissionKey !== undefined) {
      return this.isEntitledToPermission(permissionKey!, attributes);
    } else {
      throw new Error('Neither feature, nor permission key is provided.');
    }
  }
}
