import { InMemoryEntitlementsCache } from './in-memory.cache';
import { NO_EXPIRE } from '../types';

describe(InMemoryEntitlementsCache.name, () => {
  let cut: InMemoryEntitlementsCache;

  describe('given input data with no entitlements and bundle with feature "foo"', () => {
    beforeEach(() => {
      cut = InMemoryEntitlementsCache.initialize({
        snapshotOffset: 1,
        data: {
          entitlements: [],
          features: [['f-1', 'foo', []]],
          featureBundles: [['b-1', ['f-1'], 'false', []]],
          featureFlags: [],
        },
      });
    });

    it('when I ask for user "u-1" entitlement to feature "foo", then it returns no entitlement (undefined).', async () => {
      // when & then
      await expect(cut.getEntitlementExpirationTime('foo', 't-1', 'u-1')).resolves.toBeUndefined();
    });
  });

  describe('given input data with entitlement to bundle with feature "foo" (no permissions) for user "u-1"', () => {
    beforeEach(() => {
      cut = InMemoryEntitlementsCache.initialize({
        snapshotOffset: 2,
        data: {
          features: [['f-1', 'foo', []]],
          featureBundles: [['b-1', ['f-1'], 'false', []]],
          entitlements: [['b-1', 't-1', 'u-1', undefined]],
          featureFlags: [],
        },
      });
    });

    it('when I ask for user "u-1" entitlement to feature "foo", then it returns entitlement with no time limitation.', async () => {
      // when & then
      await expect(cut.getEntitlementExpirationTime('foo', 't-1', 'u-1')).resolves.toEqual(NO_EXPIRE);
    });
  });

  describe('given input data with entitlement to bundle with feature "foo" (no permissions) for tenant "t-1"', () => {
    beforeEach(() => {
      cut = InMemoryEntitlementsCache.initialize({
        snapshotOffset: 3,
        data: {
          features: [['f-1', 'foo', []]],
          featureBundles: [['b-1', ['f-1'], 'false', []]],
          entitlements: [['b-1', 't-1', undefined, undefined]],
          featureFlags: [],
        },
      });
    });

    it('when I ask for tenant "t-1" entitlement to feature "foo", then it returns entitlement with no time limitation.', async () => {
      // when & then
      await expect(cut.getEntitlementExpirationTime('foo', 't-1')).resolves.toEqual(NO_EXPIRE);
    });

    it('when I ask for user "u-1" entitlement to feature "foo", then it returns no entitlement (undefined).', async () => {
      // when & then
      await expect(cut.getEntitlementExpirationTime('foo', 't-1', 'u-1')).resolves.toBeUndefined();
    });
  });

  describe('given input data with multiple time-restricted entitlements to bundle with feature "foo" (no permissions) for user "u-1" and tenant "t-2"', () => {
    beforeEach(() => {
      cut = InMemoryEntitlementsCache.initialize({
        snapshotOffset: 4,
        data: {
          features: [['f-1', 'foo', []]],
          featureBundles: [['b-1', ['f-1'], 'false', []]],
          entitlements: [
            ['b-1', 't-1', 'u-1', '2022-06-01T12:00:00+00:00'], // TS: 1654084800000
            ['b-1', 't-1', 'u-1', '2022-07-01T12:00:00+00:00'], // TS: 1656676800000
            ['b-1', 't-2', undefined, '2022-02-01T12:00:00+00:00'], // TS: 1643716800000
            ['b-1', 't-2', undefined, '2022-03-01T12:00:00+00:00'], // TS: 1646136000000
          ],
          featureFlags: [],
        },
      });
    });

    it('when I ask for user "u-1" entitlement to feature "foo", then it returns entitlement with latest expiration time.', async () => {
      // when & then
      await expect(cut.getEntitlementExpirationTime('foo', 't-1', 'u-1')).resolves.toEqual(1656676800000);
    });

    it('when I ask for tenant "t-2" entitlement to feature "foo", then it returns entitlement with latest expiration time.', async () => {
      // when & then
      await expect(cut.getEntitlementExpirationTime('foo', 't-2')).resolves.toEqual(1646136000000);
    });
  });

  describe('given input data with mix of time-restricted and unrestricted entitlements to bundle with feature "foo" (no permissions) for user "u-1" and tenant "t-2"', () => {
    beforeEach(() => {
      cut = InMemoryEntitlementsCache.initialize({
        snapshotOffset: 4,
        data: {
          features: [['f-1', 'foo', []]],
          featureBundles: [['b-1', ['f-1'], 'false', []]],
          entitlements: [
            ['b-1', 't-1', 'u-1', '2022-06-01T12:00:00+00:00'], // TS: 1654084800000
            ['b-1', 't-1', 'u-1', undefined],
            ['b-1', 't-2', undefined, '2022-02-01T12:00:00+00:00'], // TS: 1643716800000
            ['b-1', 't-2', undefined, undefined],
          ],
          featureFlags: [],
        },
      });
    });

    it('when I ask for user "u-1" entitlement to feature "foo", then it returns entitlement without expiration time.', async () => {
      // when & then
      await expect(cut.getEntitlementExpirationTime('foo', 't-1', 'u-1')).resolves.toEqual(NO_EXPIRE);
    });

    it('when I ask for tenant "t-2" entitlement to feature "foo", then it returns entitlement without expiration time.', async () => {
      // when & then
      await expect(cut.getEntitlementExpirationTime('foo', 't-2')).resolves.toEqual(NO_EXPIRE);
    });
  });

  describe('given input data with unbundled feature "foo" (with permission "bar.baz")', () => {
    beforeEach(() => {
      cut = InMemoryEntitlementsCache.initialize({
        snapshotOffset: 5,
        data: {
          features: [['f-1', 'foo', ['bar.baz']]],
          featureBundles: [],
          entitlements: [],
          featureFlags: [],
        },
      });
    });

    it('when I ask for linked features of permission "bar.baz", then feature "foo" is returned.', async () => {
      // when
      const result = await cut.getLinkedFeatures('bar.baz');

      // then
      expect(result).toBeInstanceOf(Set);

      // and
      expect(result.has('foo')).toBeTruthy();
    });
  });
});
