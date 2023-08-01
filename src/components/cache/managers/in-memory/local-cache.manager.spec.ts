import { LocalCacheManager } from './local-cache.manager';
import { LocalCacheCollection } from './local-cache.collection';
import { LocalCacheMap } from './local-cache.map';
import { CacheValue } from '../cache.manager.interface';

describe('Local cache manager', () => {
  let localCacheManager: LocalCacheManager<CacheValue>;

  const cacheKey = 'key';
  const cacheValue = { data: 'value' };

  beforeEach(async () => {
    localCacheManager = await LocalCacheManager.create();
  });

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

  it('when .collection() is called, then instance of LocalCacheCollection is returned.', async () => {
    // given
    const cut = await LocalCacheManager.create();

    // when & then
    expect(cut.collection('my-key')).toBeInstanceOf(LocalCacheCollection);
  });

  it('when .hashmap() is called, then instance of LocalCacheMap is returned.', async () => {
    // given
    const cut = await LocalCacheManager.create();

    // when & then
    expect(cut.map('my-key')).toBeInstanceOf(LocalCacheMap);
  });

  describe('given collection instance is received by .collection(key)', () => {
    let cut: LocalCacheManager<CacheValue>;

    beforeEach(async () => {
      cut = await LocalCacheManager.create();
    });

    describe('with key that has not been created yet', () => {
      it('when .set(value) is called, then the underlying Set is created.', async () => {
        // given
        await expect(cut.get('my-key')).resolves.toBeNull();

        // when
        await cut.collection('my-key').set('foo');

        // then
        await expect(cut.get('my-key')).resolves.toStrictEqual(new Set(['foo']));
      });
    });

    describe('with key that has been created already', () => {
      let existingCollection: Set<string>;

      beforeEach(() => {
        existingCollection = new Set(['foo']);
        cut.set('my-key', existingCollection);
      });

      it('when .set(value) is called, then new value is stored in the existing Set.', async () => {
        // when
        await cut.collection('my-key').set('foo');

        // then
        const expectedSet = await cut.get('my-key');

        expect(expectedSet).toBe(existingCollection);

        // and
        expect((expectedSet as Set<unknown>).has('foo')).toBeTruthy();
      });
    });
  });

  describe('given map instance is received by .map(key)', () => {
    let cut: LocalCacheManager<CacheValue>;

    beforeEach(async () => {
      cut = await LocalCacheManager.create();
    });

    describe('with key that has not been created yet', () => {
      it('when .set(field, value) is called, then the underlying Map is created.', async () => {
        // given
        await expect(cut.get('my-key')).resolves.toBeNull();

        // when
        await cut.map('my-key').set('foo', 'bar');

        // then
        await expect(cut.get('my-key')).resolves.toStrictEqual(new Map([['foo', 'bar']]));
      });
    });

    describe('with key that has been created already', () => {
      let existingMap: Map<string, string>;

      beforeEach(() => {
        existingMap = new Map([['foo', 'bar']]);
        cut.set('my-key', existingMap);
      });

      it('when .set(field, value) is called, then new value is stored in the existing Map.', async () => {
        // when
        await cut.map('my-key').set('x', 'y');

        // then
        const expectedMap = await cut.get('my-key');

        expect(expectedMap).toBe(existingMap);

        // and
        expect((expectedMap as Map<string, string>).get('x')).toStrictEqual('y');
      });
    });
  });
});
