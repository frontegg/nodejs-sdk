import { PackageUtils } from '../../../../utils/package-loader';
import Logger from '../../../logger';
import type { RedisClientType } from 'redis';
import { RedisCacheMap } from './redis-cache.map';
import { RedisCacheCollection } from './redis-cache.collection';
import { ICacheValueSerializer } from '../../serializers/types';
import { JsonSerializer } from '../../serializers/json.serializer';
import { PrefixedManager } from '../prefixed-manager.abstract';
import type * as Redis from "redis";
import { ICacheManager, ICacheManagerCollection, ICacheManagerMap, SetOptions } from '../cache.manager.interface';

export interface IRedisOptions {
  url: string;
}

export class RedisCacheManager<T> extends PrefixedManager implements ICacheManager<T> {
  private readonly serializer: ICacheValueSerializer;

  private readonly isReadyPromise: Promise<void>;

  private constructor(private readonly redisManager: RedisClientType, prefix = '') {
    super(prefix);

    this.serializer = new JsonSerializer();

    this.isReadyPromise = this.redisManager.connect();
    this.isReadyPromise.catch((e) => Logger.error('Failed to connect to redis', e));
  }

  static create<Scope>(options: IRedisOptions, prefix = ''): Promise<RedisCacheManager<Scope>> {
    const { createClient } = PackageUtils.loadPackage('redis') as typeof Redis;

    return new RedisCacheManager<Scope>(createClient(options), prefix).ready();
  }

  ready(): Promise<this> {
    return this.isReadyPromise.then(() => this);
  }

  forScope<Scope>(prefix?: string): ICacheManager<Scope> {
    return new RedisCacheManager<Scope>(this.redisManager, prefix ?? this.prefix);
  }

  hashmap(key: string): ICacheManagerMap {
    return new RedisCacheMap(this.withPrefix(key), this.redisManager, this.serializer);
  }

  collection(key: string): ICacheManagerCollection {
    return new RedisCacheCollection(this.withPrefix(key), this.redisManager, this.serializer);
  }

  public async set<V extends T>(key: string, data: V, options?: SetOptions): Promise<void> {
    if (options?.expiresInSeconds) {
      await this.redisManager.set(
        this.withPrefix(key), this.serializer.serialize(data), { EX: options.expiresInSeconds }
      );
    } else {
      await this.redisManager.set(this.withPrefix(key), this.serializer.serialize(data));
    }
  }

  public async get<V extends T>(key: string): Promise<V | null> {
    const rawData = await this.redisManager.get(this.withPrefix(key));
    return rawData ? this.serializer.deserialize(rawData) : null;
  }

  public async del(key: string[]): Promise<void> {
    if (key.length) {
      await this.redisManager.del(key.map(this.withPrefix.bind(this)));
    }
  }
}
