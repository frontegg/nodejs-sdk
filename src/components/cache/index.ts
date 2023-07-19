import { ICacheManager, IORedisCacheManager, LocalCacheManager, RedisCacheManager } from './managers';
import { FronteggContext } from '../frontegg-context';

let cacheInstance: ICacheManager<unknown>;

export class FronteggCache {
  static async getInstance<T>(): Promise<ICacheManager<T>> {
    if (!cacheInstance) {
      cacheInstance = await FronteggCache.initialize<T>();
    }

    return cacheInstance as ICacheManager<T>;
  }

  private static async initialize<T>(): Promise<ICacheManager<T>> {
    const options = FronteggContext.getOptions();
    const { cache } = options;

    switch (cache.type) {
      case 'ioredis':
        return IORedisCacheManager.create<T>(cache.options);
      case 'redis':
        return RedisCacheManager.create<T>(cache.options);
      default:
        return LocalCacheManager.create<T>();
    }
  }
}
