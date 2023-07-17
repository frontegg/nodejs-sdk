import { ICacheManager, IORedisCacheManager, LocalCacheManager, RedisCacheManager } from './managers';
import { FronteggContext } from '../frontegg-context';

let cacheInstance: ICacheManager<unknown>;

export class FronteggCache {
  static getInstance<T>(): ICacheManager<T> {
    if (!cacheInstance) {
      cacheInstance = FronteggCache.initialize<T>();
    }

    return cacheInstance as ICacheManager<T>;
  }

  private static initialize<T>(): ICacheManager<T> {
    const options = FronteggContext.getOptions();
    const cache = options.accessTokensOptions?.cache || options.cache;

    switch (cache.type) {
      case 'ioredis':
        return new IORedisCacheManager(cache.options);
      case 'redis':
        return new RedisCacheManager(cache.options);
      default:
        return new LocalCacheManager();
    }
  }
}
