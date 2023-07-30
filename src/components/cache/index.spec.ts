import { IIORedisCacheOptions, ILocalCacheOptions, IRedisCacheOptions } from '../frontegg-context/types';
import { FronteggContext } from '../frontegg-context';

describe('FronteggContext', () => {
  beforeEach(() => {
    /**
     * In this test suite we need to reset Node modules and import them in every test case, so "fresh" modules are provided.
     * This is the way to deal with singletons defined in the scope of module.
     */
    jest.resetModules();
  });

  function mockCache(name: string) {
    jest.mock('./managers');
    const { [name]: Manager } = require('./managers');

    const cacheManagerMock = {};
    jest.mocked(Manager.create).mockResolvedValue(cacheManagerMock);

    return cacheManagerMock;
  }

  describe.each([
    {
      cacheConfigInfo: 'no cache',
      config: {},
      expectedCacheName: 'LocalCacheManager',
    },
    {
      cacheConfigInfo: 'explicit local cache',
      config: {
        type: 'local',
      } as ILocalCacheOptions,
      expectedCacheName: 'LocalCacheManager',
    },
    {
      cacheConfigInfo: "type of 'ioredis' in `$.cache`",
      config: {
        cache: {
          type: 'ioredis',
          options: { host: 'foo', password: 'bar', db: 0, port: 6372 },
        } as IIORedisCacheOptions,
      },
      expectedCacheName: 'IORedisCacheManager',
    },
    {
      cacheConfigInfo: "type of 'redis' in `$.cache`",
      config: {
        cache: {
          type: 'redis',
          options: { url: 'redis://url:6372' },
        } as IRedisCacheOptions,
      },
      expectedCacheName: 'RedisCacheManager',
    },
  ])('given $cacheConfigInfo configuration in FronteggContext', ({ config, expectedCacheName }) => {
    let expectedCache;

    beforeEach(() => {
      expectedCache = mockCache(expectedCacheName);
      const { FronteggContext } = require('../frontegg-context');

      FronteggContext.init(
        {
          FRONTEGG_CLIENT_ID: 'foo',
          FRONTEGG_API_KEY: 'bar',
        },
        config,
      );
    });

    it(`when cache is initialized, then the ${expectedCacheName} is returned.`, async () => {
      // given
      const { FronteggCache } = require('./index');

      // when
      const cache = await FronteggCache.getInstance();

      // then
      expect(cache).toBe(expectedCache);
    });
  });
});
