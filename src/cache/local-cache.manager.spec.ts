import { LocalCacheManager } from './local-cache.manager';

describe('Local cache manager', () => {
  const localCacheManager = new LocalCacheManager<{ data: string }>();
  const cacheKey = 'key';
  const cacheValue = { data: 'value' };

  it('should set, get and delete from local cache manager', async () => {
    await localCacheManager.set(cacheKey, cacheValue);
    const res = await localCacheManager.get(cacheKey);
    expect(res).toEqual(cacheValue);
    await localCacheManager.del([cacheKey]);
    const resAfterDel = await localCacheManager.get(cacheKey);
    expect(resAfterDel).toEqual(null);
  });

  it('should get null after expiration time', async () => {
    await localCacheManager.set(cacheKey, cacheValue, { expiresInSeconds: 1 });
    await new Promise((r) => setTimeout(r, 500));
    const res = await localCacheManager.get(cacheKey);
    expect(res).toEqual(cacheValue);

    await new Promise((r) => setTimeout(r, 600));

    const resAfterDel = await localCacheManager.get(cacheKey);
    expect(resAfterDel).toEqual(null);
  });
});
