import { IORedisCacheManager } from './ioredis-cache.manager';

jest.mock('../../../utils/package-loader', () => ({
  PackageUtils: {
    loadPackage: (name: string) => {
      switch (name) {
        case 'ioredis':
          return require('ioredis-mock');
      }
    },
  },
}));

describe('IORedis cache manager', () => {
  let redisCacheManager: IORedisCacheManager<{ data: string }>;

  beforeEach(async () => {
    redisCacheManager = await IORedisCacheManager.create();
  });

  const cacheKey = 'key';
  const cacheValue = { data: 'value' };

  it('should set, get and delete from redis cache manager', async () => {
    await redisCacheManager.set(cacheKey, cacheValue);
    const res = await redisCacheManager.get(cacheKey);
    expect(res).toEqual(cacheValue);
    await redisCacheManager.del([cacheKey]);
    const resAfterDel = await redisCacheManager.get(cacheKey);
    expect(resAfterDel).toEqual(null);
  });

  it('should get null after expiration time', async () => {
    await redisCacheManager.set(cacheKey, cacheValue, { expiresInSeconds: 1 });
    await new Promise((r) => setTimeout(r, 500));
    const res = await redisCacheManager.get(cacheKey);
    expect(res).toEqual(cacheValue);

    await new Promise((r) => setTimeout(r, 600));

    const resAfterDel = await redisCacheManager.get(cacheKey);
    expect(resAfterDel).toEqual(null);
  });
});
