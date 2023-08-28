import * as NodeCache from 'node-cache';
import { LocalCacheMap } from './local-cache.map';
import { LocalCacheCollection } from './local-cache.collection';
import { PrefixedManager } from '../prefixed-manager.abstract';
import {
  CacheValue,
  ICacheManager,
  ICacheManagerCollection,
  ICacheManagerMap,
  SetOptions,
} from '../cache.manager.interface';

export class LocalCacheManager<T extends CacheValue> extends PrefixedManager implements ICacheManager<T> {
  private constructor(private readonly nodeCache: NodeCache, prefix = '') {
    super(prefix);
  }

  static async create<Scope extends CacheValue>(prefix = ''): Promise<LocalCacheManager<Scope>> {
    return new LocalCacheManager<Scope>(
      new NodeCache({
        useClones: false,
      }),
      prefix,
    );
  }

  public async set<T>(key: string, data: T, options?: SetOptions): Promise<void> {
    if (options?.expiresInSeconds) {
      this.nodeCache.set(this.withPrefix(key), data, options.expiresInSeconds);
    } else {
      this.nodeCache.set(this.withPrefix(key), data);
    }
  }

  public async get<T>(key: string): Promise<T | null> {
    return this.nodeCache.get(this.withPrefix(key)) || null;
  }

  public async del(key: string[]): Promise<void> {
    if (key.length) {
      this.nodeCache.del(key.map(this.withPrefix.bind(this)));
    }
  }

  async expire(keys: string[], ttlMs: number): Promise<void> {
    const ttlSec = Math.round(ttlMs / 1000);

    keys.forEach((key) => this.nodeCache.ttl(this.withPrefix(key), ttlSec));
  }

  map(key: string): ICacheManagerMap<T> {
    return new LocalCacheMap(this.withPrefix(key), this.nodeCache);
  }

  collection(key: string): ICacheManagerCollection<T> {
    return new LocalCacheCollection(this.withPrefix(key), this.nodeCache);
  }

  forScope<Scope extends CacheValue>(prefix?: string): ICacheManager<Scope> {
    return new LocalCacheManager<Scope>(this.nodeCache, prefix ?? this.prefix);
  }

  async close(): Promise<void> {
    this.nodeCache.close();
  }
}
