import type { Feature } from '../entitlements';
import type { OperationEnum } from '@frontegg/entitlements-javascript-commons';

type On = boolean;
export type TreatmentEnum = 'true' | 'false';
type DefaultTreatment = TreatmentEnum;
type OffTreatment = TreatmentEnum;
type TreatmentType = 'boolean';

export interface IRule {
  description: string;
  conditionLogic: 'and';
  conditions: {
    attribute: string;
    attributeType: 'custom' | 'frontegg';
    negate: boolean;
    op: OperationEnum;
    value: Record<string, any>;
  }[];
  treatment: TreatmentEnum;
}

export type Tuple = [Feature.Key, On, TreatmentType, DefaultTreatment, OffTreatment, IRule[]];
