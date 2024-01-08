import { mapFromTuple } from './plan-tuple.mapper';
import { fc, it } from '@fast-check/jest';
import type { FeatureBundleTuple } from '../../../types';
import { Plan, OperationEnum } from '@frontegg/entitlements-javascript-commons';
import type { IRule } from '../../../api-types/vendor-entitlements/v1/feature-flags';

const TreatmentEnumValues: IRule['treatment'][] = ['true', 'false'];

describe(mapFromTuple.name, () => {
  it.prop(
    [
      fc.uuid(),
      fc.array(fc.uuid()),
      fc.constantFrom<IRule['treatment']>('true'),
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
      id: string,
      featureIds: string[],
      def: IRule['treatment'],
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
          id,
          featureIds,
          def,
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
        ] as FeatureBundleTuple),
      ).toMatchObject({
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
      } as Plan);
    },
  );
});
