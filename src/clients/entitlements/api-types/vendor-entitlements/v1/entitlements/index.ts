import type * as FeatureSet from './feature-set';

type TenantId = string;
type UserId = string;
type ExpirationDate = string;
export type Tuple = [FeatureSet.Id, TenantId, UserId | undefined, ExpirationDate | undefined];

export * as Feature from './feature';
export * as FeatureSet from './feature-set';
