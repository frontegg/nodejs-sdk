import { Plan, Rule, TreatmentEnum } from '@frontegg/entitlements-javascript-commons';
import { RawConditionValue } from '@frontegg/entitlements-javascript-commons/dist/operations/types';
import { ConditionLogicEnum } from '@frontegg/entitlements-javascript-commons/dist/rules';
import { VendorEntitlementsV1 } from '../../../api-types';
import { FeatureBundleTuple } from '../../../types';

export function mapFromTuple(tuple: FeatureBundleTuple): Plan {
  const [, , defaultTreatment, rules] = tuple;
  return {
    defaultTreatment: defaultTreatment as TreatmentEnum,
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
