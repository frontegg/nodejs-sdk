import * as NodeCache from 'node-cache';
import { ICacheManagerMap } from '../cache.manager.interface';

export class LocalCacheMap implements ICacheManagerMap {
  constructor(
    private readonly key: string,
    private readonly cache: NodeCache
  ) {
  }

  private ensureMapInCache<T>(): Map<string, T> {
    if (!this.cache.has(this.key)) {
      this.cache.set(this.key, new Map());
    }

    return this.cache.get(this.key)!;
  }

  async del(field: string): Promise<void> {
    this.ensureMapInCache().delete(field);
  }
  async get<T>(field: string): Promise<T | null> {
    return this.ensureMapInCache<T>().get(field) || null;
  }
  async set<T>(field: string, data: T): Promise<void> {
    this.ensureMapInCache<T>().set(field, data);
  }
}