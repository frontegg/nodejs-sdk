import { mapFromTuple } from './feature-flag-tuple.mapper';
import { fc, it } from '@fast-check/jest';
import { FeatureFlagTuple } from '../../../types';
import {
  AttributeSourceEnum,
  IRule,
  OperationEnum,
  TreatmentEnum,
  TreatmentTypeEnum,
  ConditionLogicEnum,
} from '@frontegg/entitlements-service-types';
import { FeatureFlag } from '@frontegg/entitlements-javascript-commons';

const TreatmentEnumValues = Object.values(TreatmentEnum);

describe(mapFromTuple.name, () => {
  it.prop(
    [
      fc.string({ size: 'small' }),
      fc.boolean(),
      fc.constantFrom(...TreatmentEnumValues),
      fc.constantFrom(...TreatmentEnumValues),
      fc.constantFrom(...TreatmentEnumValues),
      fc.string({ size: 'small' }),
      fc.string(),
      fc.boolean(),
      fc.constantFrom(...Object.values(OperationEnum)),
    ],
    { verbose: true },
  )(
    'maps tuple to FeatureFlag structure',
    (
      featKey: string,
      isOn: boolean,
      def: TreatmentEnum,
      whenOff: TreatmentEnum,
      ruleTreatment: TreatmentEnum,
      attribute: string,
      attrValue: string,
      negate: boolean,
      op: OperationEnum,
    ) => {
      // given
      const conditionValue = { string: attrValue };

      expect(
        mapFromTuple([
          featKey,
          isOn,
          TreatmentTypeEnum.Boolean,
          def,
          whenOff,
          [
            {
              conditionLogic: ConditionLogicEnum.And,
              conditions: [
                {
                  attribute,
                  negate,
                  op,
                  attributeType: AttributeSourceEnum.Custom,
                  value: conditionValue,
                },
              ],
              description: 'Irrelevant',
              treatment: ruleTreatment,
            } as IRule,
          ],
        ] as FeatureFlagTuple),
      ).toMatchObject({
        on: isOn,
        offTreatment: whenOff,
        defaultTreatment: def,
        rules: [
          {
            conditionLogic: ConditionLogicEnum.And,
            conditions: [
              {
                negate,
                attribute,
                op,
                value: conditionValue,
              },
            ],
            treatment: ruleTreatment,
          },
        ],
      } as FeatureFlag);
    },
  );
});
