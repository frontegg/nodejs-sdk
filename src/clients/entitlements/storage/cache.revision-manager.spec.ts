import { CacheRevisionManager, CURRENT_CACHE_REVISION } from './cache.revision-manager';
import { mock, mockReset } from 'jest-mock-extended';
import { CacheValue, ICacheManager } from '../../../components/cache/managers';
import { VendorEntitlementsDto } from '../types';
import type { FronteggEntitlementsCache } from './frontegg-cache/frontegg.cache';
import { FronteggEntitlementsCacheInitializer } from './frontegg-cache/frontegg.cache-initializer';

jest.mock('./frontegg-cache/frontegg.cache-initializer');

describe(CacheRevisionManager.name, () => {
  const entitlementsCacheMock = mock<FronteggEntitlementsCache>();

  const cacheMock = mock<ICacheManager<CacheValue>>();
  let cut: CacheRevisionManager;

  beforeAll(() => {
    jest.mocked(FronteggEntitlementsCacheInitializer.forFollower).mockResolvedValue(entitlementsCacheMock);
    jest.mocked(FronteggEntitlementsCacheInitializer.forLeader).mockResolvedValue(entitlementsCacheMock);
  });

  beforeEach(() => {
    cut = new CacheRevisionManager(cacheMock);
  });

  afterEach(() => {
    mockReset(cacheMock);
    mockReset(entitlementsCacheMock);

    jest.mocked(FronteggEntitlementsCacheInitializer.forFollower).mockClear();
    jest.mocked(FronteggEntitlementsCacheInitializer.forLeader).mockClear();
  });

  describe('given the currently supported revision is: 1', () => {
    beforeEach(() => {
      cacheMock.get.calledWith(CURRENT_CACHE_REVISION).mockResolvedValue(1);

      cut.followRevision(1);
    });

    it('when I call .getCurrentCacheRevision(), then it resolves to that revision (1), taken from cache.', async () => {
      // when & then
      await expect(cut.getCurrentCacheRevision()).resolves.toEqual(1);

      // then
      expect(cacheMock.get).toHaveBeenCalledWith(CURRENT_CACHE_REVISION);
    });

    describe('when .loadSnapshotAsCurrent(..) is called with DTO having different offset', () => {
      function getDTO(rev: number): VendorEntitlementsDto {
        return {
          snapshotOffset: rev,
          data: {
            features: [],
            entitlements: [],
            featureBundles: [],
          },
        };
      }

      let loadingSnapshotResult;

      describe('with DTO having different offset (333)', () => {
        let expectedNewEntitlementsCache;

        beforeEach(async () => {
          // given: expected new entitlements cache instance following given revision
          expectedNewEntitlementsCache = mock<FronteggEntitlementsCache>();
          jest.mocked(FronteggEntitlementsCacheInitializer.forLeader).mockResolvedValue(expectedNewEntitlementsCache);

          // when
          loadingSnapshotResult = await cut.loadSnapshotAsCurrent(getDTO(333));
        });

        it('then it resolves to IsUpdatedToRev structure telling with updated revision.', async () => {
          // then
          expect(loadingSnapshotResult).toEqual({ isUpdated: true, revision: 333 });
        });

        it('then new offset is stored as current cache revision.', async () => {
          // then
          expect(cacheMock.set).toHaveBeenCalledWith(CURRENT_CACHE_REVISION, 333);
        });

        it('then new instance of entitlements cache is created from given DTO.', () => {
          // then
          expect(FronteggEntitlementsCacheInitializer.forLeader).toHaveBeenCalledWith(getDTO(333));

          // and
          expect(cut.getCache()).toBe(expectedNewEntitlementsCache);
        });
      });

      describe('with DTO having the same offset (1)', () => {
        beforeEach(async () => {
          // given
          jest.mocked(FronteggEntitlementsCacheInitializer.forLeader).mockClear();
          jest.mocked(FronteggEntitlementsCacheInitializer.forFollower).mockClear();

          // when
          loadingSnapshotResult = await cut.loadSnapshotAsCurrent(getDTO(1));
        });

        it('then it resolves to IsUpdatedToRev structure telling nothing got updated and revision (1).', async () => {
          // then
          expect(loadingSnapshotResult).toEqual({ isUpdated: false, revision: 1 });
        });

        it('then new entitlements cache instance was not created.', async () => {
          // then
          expect(FronteggEntitlementsCacheInitializer.forLeader).not.toHaveBeenCalled();
          expect(FronteggEntitlementsCacheInitializer.forFollower).not.toHaveBeenCalled();

          // and
          expect(cut.getCache()).toBe(entitlementsCacheMock);
        });

        it('then DTO revision (1) is not updated.', async () => {
          // then
          expect(cacheMock.set).not.toHaveBeenCalledWith(CURRENT_CACHE_REVISION, expect.anything());
        });
      });
    });

    describe('when .followRevision(..) is called', () => {
      let resultPromise;

      describe('with the same revision (1) as currently stored', () => {
        let resultPromise;
        beforeEach(async () => {
          // given: clear the execution count here
          jest.mocked(FronteggEntitlementsCacheInitializer.forFollower).mockClear();

          // when: follow the same revision
          resultPromise = cut.followRevision(1);
        });

        it('then entitlements cache is not replaced.', async () => {
          // when
          await resultPromise;

          // then
          expect(FronteggEntitlementsCacheInitializer.forFollower).not.toHaveBeenCalled();
        });

        it('then it resolves to IsUpdatedToRev structure with the current revision (1).', async () => {
          // when & then
          await expect(resultPromise).resolves.toEqual({
            isUpdated: false,
            revision: 1,
          });
        });
      });

      describe('with the different revision (3) than currently stored', () => {
        let expectedNewEntitlementsCache;

        beforeEach(async () => {
          // given: clear the execution count here
          jest.mocked(FronteggEntitlementsCacheInitializer.forFollower).mockClear();

          // given: expected new entitlements cache instance following given revision
          expectedNewEntitlementsCache = mock<FronteggEntitlementsCache>();
          jest.mocked(FronteggEntitlementsCacheInitializer.forFollower).mockResolvedValue(expectedNewEntitlementsCache);

          // when: follow the same revision
          resultPromise = cut.followRevision(3);
        });

        it('then it resolves to IsUpdatedToRev structure with the new revision and "isUpdated" flag up.', async () => {
          // when & then
          await expect(resultPromise).resolves.toEqual({
            isUpdated: true,
            revision: 3,
          });
        });

        it('then new instance of entitlements cache for new revision (3) is created.', async () => {
          // when
          await resultPromise;

          // then
          expect(FronteggEntitlementsCacheInitializer.forFollower).toHaveBeenCalledWith(3);

          // and
          expect(cut.getCache() === expectedNewEntitlementsCache).toBeTruthy();
        });
      });
    });
  });

  describe('given the instance does neither follow any revision, nor loaded any revision to cache', () => {
    it('when I call .getCache(), then it returns undefined.', () => {
      expect(cut.getCache()).toBeUndefined();
    });
  });
});
