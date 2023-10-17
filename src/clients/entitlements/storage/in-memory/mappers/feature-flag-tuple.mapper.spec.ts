import { mapFromTuple } from './feature-flag-tuple.mapper';
import { fc, it } from '@fast-check/jest';
import type { FeatureFlagTuple } from '../../../types';
import { FeatureFlag, OperationEnum } from '@frontegg/entitlements-javascript-commons';
import type { IRule } from '../../../api-types/vendor-entitlements/v1/feature-flags';

const TreatmentEnumValues: IRule['treatment'][] = ['true', 'false'];

describe(mapFromTuple.name, () => {
  it.prop(
    [
      fc.string({ size: 'small' }),
      fc.boolean(),
      fc.constantFrom<IRule['treatment']>('true'),
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
      def: IRule['treatment'],
      whenOff: IRule['treatment'],
      ruleTreatment: IRule['treatment'],
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
          'boolean',
          def,
          whenOff,
          [
            {
              conditionLogic: 'and',
              conditions: [
                {
                  attribute,
                  negate,
                  op,
                  attributeType: 'custom',
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
            conditionLogic: 'and',
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
