import 'jest-extended';
import { FronteggEntitlementsCacheInitializer } from './frontegg.cache-initializer';
import { FronteggEntitlementsCache } from './frontegg.cache';
import { ICacheManager, ICacheManagerCollection, ICacheManagerMap } from '../../../../components/cache/managers';
import { mock, mockClear } from 'jest-mock-extended';
import { FronteggCache } from '../../../../components/cache';
import { EntitlementTuple, FeatureBundleTuple, FeatureTuple, VendorEntitlementsDto } from '../../types';
import { ENTITLEMENTS_MAP_KEY, PERMISSIONS_COLLECTION_LIST } from './frontegg.cache-key.utils';

jest.mock('./frontegg.cache');
jest.mock('../../../../components/cache');

const FronteggEntitlementsCache_Actual: typeof FronteggEntitlementsCache =
  jest.requireActual('./frontegg.cache').FronteggEntitlementsCache;

describe(FronteggEntitlementsCacheInitializer.name, () => {
  let cacheMock = mock<ICacheManager<any>>();
  let entitlementsCacheMock = mock<FronteggEntitlementsCache>();

  beforeAll(() => {
    // given: frontegg cache is mocked
    jest.mocked(FronteggCache.getInstance).mockResolvedValue(cacheMock);

    // given: mocked cache will scope to itself
    cacheMock.forScope.mockReturnValue(cacheMock);

    // given: entitlements cache returns the mocked cache
    entitlementsCacheMock.getCacheManager.mockReturnValue(cacheMock);
  });

  beforeEach(() => {
    // given: by default return the mocked entitlements cache
    jest.mocked(FronteggEntitlementsCache).mockReturnValue(entitlementsCacheMock);
  });

  afterEach(() => {
    mockClear(cacheMock);
    mockClear(entitlementsCacheMock);

    jest.mocked(FronteggEntitlementsCache).mockReset();
  });

  describe('when .forFollower(..) is called with revision (3)', () => {
    it('then it sets up FronteggEntitlementsCache to track revision in FronteggCache cache.', async () => {
      // given: call the real constructor
      jest
        .mocked(FronteggEntitlementsCache)
        .mockImplementationOnce(
          (cache: ICacheManager<any>, revision: number) => new FronteggEntitlementsCache_Actual(cache, revision),
        );

      // when & then
      await expect(FronteggEntitlementsCacheInitializer.forFollower(33)).resolves.toBeInstanceOf(
        FronteggEntitlementsCache_Actual,
      );

      // then
      expect(FronteggEntitlementsCache).toHaveBeenCalledWith(cacheMock, 33);
    });

    it('then it does not set any value to cache.', async () => {
      // when
      await FronteggEntitlementsCacheInitializer.forFollower(33);

      // then
      expect(cacheMock.set).not.toHaveBeenCalled();
      expect(cacheMock.map).not.toHaveBeenCalled();
      expect(cacheMock.del).not.toHaveBeenCalled();
      expect(cacheMock.collection).not.toHaveBeenCalled();
    });
  });

  describe('given vendor entitlements DTO with offset (5)', () => {
    function buildDTO(
      offset: number,
      features: FeatureTuple[] = [],
      bundles: FeatureBundleTuple[] = [],
      entitlements: EntitlementTuple[] = [],
    ): VendorEntitlementsDto {
      return {
        snapshotOffset: offset,
        data: {
          features,
          featureBundles: bundles,
          entitlements,
        },
      };
    }

    describe('and feature, bundle and entitlement', () => {
      let dto: VendorEntitlementsDto;

      beforeEach(() => {
        dto = buildDTO(
          5,
          [
            ['f-1', 'foo', ['foo.read']],
            ['f-2', 'boo', ['foo.write']],
          ],
          [['b-1', ['f-1', 'f-2']]],
          [
            ['b-1', 't-1', 'u-1', undefined],
            ['b-1', 't-2', undefined, undefined],
          ],
        );
      });

      describe('when .forLeader(dto) is called', () => {
        let result;

        const permissionToFeatureCollectionMock = mock<ICacheManagerCollection<any>>();
        const permissionsCollectionMock = mock<ICacheManagerCollection<any>>();
        const entitlementsMapMock = mock<ICacheManagerMap<any>>();

        beforeAll(() => {
          cacheMock.collection.calledWith(PERMISSIONS_COLLECTION_LIST).mockReturnValue(permissionsCollectionMock);
          cacheMock.map.calledWith(ENTITLEMENTS_MAP_KEY).mockReturnValue(entitlementsMapMock);
          cacheMock.collection
            .calledWith(expect.stringContaining('perms:'))
            .mockReturnValue(permissionToFeatureCollectionMock);
        });

        beforeEach(async () => {
          result = await FronteggEntitlementsCacheInitializer.forLeader(dto);
        });

        afterEach(() => {
          mockClear(permissionsCollectionMock);
          mockClear(entitlementsMapMock);
        });

        it('then list of all permissions is written to cache.', () => {
          // then
          expect(permissionsCollectionMock.set).toHaveBeenCalledWith('foo.read');
          expect(permissionsCollectionMock.set).toHaveBeenCalledWith('foo.write');

          expect(permissionsCollectionMock.set).toHaveBeenCalledTimes(2);

          // and:
          expect(cacheMock.collection).toHaveBeenCalledWith('perms:foo.read');
          expect(permissionToFeatureCollectionMock.set).toHaveBeenCalledWith('foo');

          // and:
          expect(cacheMock.collection).toHaveBeenCalledWith('perms:foo.write');
          expect(permissionToFeatureCollectionMock.set).toHaveBeenCalledWith('boo');
        });

        it('then mapping of permission to feature is written to cache.', () => {
          // then
          expect(cacheMock.collection).toHaveBeenCalledWith('perms:foo.read');
          expect(permissionToFeatureCollectionMock.set).toHaveBeenCalledWith('foo');

          // and:
          expect(cacheMock.collection).toHaveBeenCalledWith('perms:foo.write');
          expect(permissionToFeatureCollectionMock.set).toHaveBeenCalledWith('boo');
        });

        it('then each entitlement to bundle is resolved to "entitlement to feature" and written to cache.', () => {
          // then
          expect(cacheMock.map).toHaveBeenCalledWith(ENTITLEMENTS_MAP_KEY);

          // and
          expect(entitlementsMapMock.set).toHaveBeenCalledWith('t-1:u-1:foo', expect.toBeNumber());
          expect(entitlementsMapMock.set).toHaveBeenCalledWith('t-1:u-1:boo', expect.toBeNumber());

          // and
          expect(entitlementsMapMock.set).toHaveBeenCalledWith('t-2::foo', expect.toBeNumber());
          expect(entitlementsMapMock.set).toHaveBeenCalledWith('t-2::boo', expect.toBeNumber());
        });
      });
    });
  });
});
