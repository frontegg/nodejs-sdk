import { IRule, TreatmentEnum } from '../feature-flags';
import type { Id as FeatureId } from './feature';

export type Id = string;
export type DefaultTreatment = TreatmentEnum;

export type Tuple = [Id, FeatureId[], DefaultTreatment, IRule[]];
