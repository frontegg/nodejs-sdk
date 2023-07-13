import { ICacheManager, IORedisCacheManager, LocalCacheManager, RedisCacheManager } from './managers';
import { FronteggContext } from '../frontegg-context';

let cacheInstance: ICacheManager;

export class FronteggCache {
  static getInstance(): ICacheManager {
    if (!cacheInstance) {
      cacheInstance = FronteggCache.initialize();
    }

    return cacheInstance;
  }

  private static initialize(): ICacheManager {
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
