import {
  CacheValue,
  ICacheManager,
  ICacheManagerCollection,
  ICacheManagerMap,
  SetOptions,
} from '../cache.manager.interface';
import { PackageUtils } from '../../../../utils/package-loader';
import Logger from '../../../logger';

import type * as Redis from 'redis';
import { PrefixedManager } from '../prefixed-manager.abstract';
import { ICacheValueSerializer } from '../../serializers/types';
import { JsonSerializer } from '../../serializers/json.serializer';
import { RedisCacheCollection } from './redis-cache.collection';
import { RedisCacheMap } from './redis-cache.map';

export interface IRedisOptions {
  url: string;
}

export class RedisCacheManager<T extends CacheValue> extends PrefixedManager implements ICacheManager<T> {
  private readonly serializer: ICacheValueSerializer;
  private readonly isReadyPromise: Promise<void>;

  private constructor(private readonly redisManager: Redis.RedisClientType, prefix = '') {
    super(prefix);

    this.serializer = new JsonSerializer();

    this.isReadyPromise = this.redisManager.connect();
    this.isReadyPromise.catch((e) => Logger.error('Failed to connect to redis', e));
  }

  static create<Scope extends CacheValue>(options: IRedisOptions, prefix = ''): Promise<RedisCacheManager<Scope>> {
    const { createClient } = PackageUtils.loadPackage('redis') as typeof Redis;

    return new RedisCacheManager<Scope>(createClient(options), prefix).ready();
  }

  ready(): Promise<this> {
    return this.isReadyPromise.then(() => this);
  }

  public async set<T>(key: string, data: T, options?: SetOptions): Promise<void> {
    if (options?.expiresInSeconds) {
      await this.redisManager.set(this.withPrefix(key), JSON.stringify(data), { EX: options.expiresInSeconds });
    } else {
      await this.redisManager.set(this.withPrefix(key), JSON.stringify(data));
    }
  }

  public async get<T>(key: string): Promise<T | null> {
    const stringifiedData = await this.redisManager.get(this.withPrefix(key));
    return stringifiedData ? JSON.parse(stringifiedData) : null;
  }

  public async del(key: string[]): Promise<void> {
    if (key.length) {
      await this.redisManager.del(key.map(this.withPrefix.bind(this)));
    }
  }

  map(key: string): ICacheManagerMap<T> {
    return new RedisCacheMap(this.withPrefix(key), this.redisManager, this.serializer);
  }

  collection(key: string): ICacheManagerCollection<T> {
    return new RedisCacheCollection(this.withPrefix(key), this.redisManager, this.serializer);
  }

  async expire(keys: string[], ttlMs: number): Promise<void> {
    for (const key of keys) {
      await this.redisManager.PEXPIRE(this.withPrefix(key), ttlMs);
    }
  }
  forScope<Scope extends CacheValue>(prefix?: string): ICacheManager<Scope> {
    return new RedisCacheManager<Scope>(this.redisManager, prefix ?? this.prefix);
  }

  close(): Promise<void> {
    return this.redisManager.disconnect();
  }
}
