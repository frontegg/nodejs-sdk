import { ICacheManager, SetOptions } from './cache.manager.interface';
import * as NodeCache from 'node-cache';

export class LocalCacheManager<T> implements ICacheManager<T> {
  private nodeCache: NodeCache = new NodeCache();

  public async set(key: string, data: T, options?: SetOptions): Promise<void> {
    if (options?.expiresInSeconds) {
      this.nodeCache.set(key, data, options.expiresInSeconds);
    } else {
      this.nodeCache.set(key, data);
    }
  }

  public async get(key: string): Promise<T | null> {
    return this.nodeCache.get(key) || null;
  }

  public async del(key: string[]): Promise<void> {
    if (key.length) {
      this.nodeCache.del(key);
    }
  }
}
