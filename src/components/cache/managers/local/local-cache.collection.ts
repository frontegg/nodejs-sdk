import * as NodeCache from 'node-cache';
import { ICacheManagerCollection } from '../cache.manager.interface';

export class LocalCacheCollection<T> implements ICacheManagerCollection<T> {
  constructor(private readonly key: string, private readonly cache: NodeCache) {}

  private ensureSetInCache<T>(): Set<T> {
    if (!this.cache.has(this.key)) {
      this.cache.set(this.key, new Set());
    }

    return this.cache.get(this.key)!;
  }

  async has<T>(value: T): Promise<boolean> {
    return this.ensureSetInCache().has(value);
  }

  async set<T>(value: T): Promise<void> {
    this.ensureSetInCache().add(value);
  }

  async getAll<T>(): Promise<Set<T>> {
    return this.ensureSetInCache<T>();
  }
}