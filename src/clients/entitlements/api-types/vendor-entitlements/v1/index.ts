import * as Entitlements from './entitlements';
import * as FeatureFlags from './feature-flags';

export * as FeatureFlags from './feature-flags';
export * as Entitlements from './entitlements';

export type GetDTO = {
  data: {
    features: Entitlements.Feature.Tuple[];
    featureBundles: Entitlements.FeatureSet.Tuple[];
    entitlements: Entitlements.Tuple[];
    featureFlags: FeatureFlags.Tuple[];
  };
  snapshotOffset: number;
};
