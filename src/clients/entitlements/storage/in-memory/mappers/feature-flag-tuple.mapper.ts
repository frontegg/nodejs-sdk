import { FeatureFlagTuple } from '../../../types';
import { FeatureFlag, Rule } from '@frontegg/entitlements-javascript-commons';
import { IRule } from '@frontegg/entitlements-service-types';
import { RawConditionValue } from '@frontegg/entitlements-javascript-commons/dist/operations/types';

export function mapFromTuple(tuple: FeatureFlagTuple): FeatureFlag {
  const [, /* featureKey */ on /* type */, , defaultTreatment, offTreatment, rules] = tuple;

  return {
    on,
    defaultTreatment,
    offTreatment,
    rules: rules.map(mapRule),
  };
}

function mapRule(rule: IRule): Rule {
  return {
    treatment: rule.treatment,
    conditions: rule.conditions.map((condition) => {
      return {
        op: condition.op,
        value: condition.value as RawConditionValue,
        negate: condition.negate,
        attribute: condition.attribute,
      };
    }),
    conditionLogic: rule.conditionLogic,
  };
}
