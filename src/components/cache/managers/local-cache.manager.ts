import { ICacheManager, SetOptions } from './cache.manager.interface';
import * as NodeCache from 'node-cache';
import { PrefixedManager } from './prefixed-manager.abstract';

export class LocalCacheManager<T> extends PrefixedManager implements ICacheManager<T> {
  private constructor(private readonly nodeCache: NodeCache, prefix: string = '') {
    super(prefix);
  }

  static async create<Scope>(prefix: string = ''): Promise<LocalCacheManager<Scope>> {
    return new LocalCacheManager<Scope>(new NodeCache(), prefix);
  }

  public async set<T>(key: string, data: T, options?: SetOptions): Promise<void> {
    if (options?.expiresInSeconds) {
      this.nodeCache.set(key, data, options.expiresInSeconds);
    } else {
      this.nodeCache.set(key, data);
    }
  }

  public async get<T>(key: string): Promise<T | null> {
    return this.nodeCache.get(key) || null;
  }

  public async del(key: string[]): Promise<void> {
    if (key.length) {
      this.nodeCache.del(key.map(this.withPrefix.bind(this)));
    }
  }

  forScope<Scope>(prefix?: string): ICacheManager<Scope> {
    return new LocalCacheManager<Scope>(this.nodeCache, prefix ?? this.prefix);
  }
}
