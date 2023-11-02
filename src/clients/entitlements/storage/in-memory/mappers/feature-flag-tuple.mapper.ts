import type { FeatureFlagTuple } from '../../../types';
import type { FeatureFlag, Rule, TreatmentEnum } from '@frontegg/entitlements-javascript-commons';
import type { RawConditionValue } from '@frontegg/entitlements-javascript-commons/dist/operations/types';
import type { VendorEntitlementsV1 } from '../../../api-types';
import type { ConditionLogicEnum } from '@frontegg/entitlements-javascript-commons/dist/rules';

export function mapFromTuple(tuple: FeatureFlagTuple): FeatureFlag {
  const [, /* featureKey */ on /* type */, , defaultTreatment, offTreatment, rules] = tuple;

  return {
    on,
    defaultTreatment: defaultTreatment as TreatmentEnum,
    offTreatment: offTreatment as TreatmentEnum,
    rules: rules.map(mapRule),
  };
}

function mapRule(rule: VendorEntitlementsV1.FeatureFlags.IRule): Rule {
  return {
    treatment: rule.treatment as TreatmentEnum,
    conditions: rule.conditions.map((condition) => {
      return {
        op: condition.op,
        value: condition.value as RawConditionValue,
        negate: condition.negate,
        attribute: condition.attribute,
      };
    }),
    conditionLogic: rule.conditionLogic as ConditionLogicEnum,
  };
}
