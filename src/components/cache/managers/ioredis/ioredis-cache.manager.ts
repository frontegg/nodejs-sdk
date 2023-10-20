import type { Redis } from 'ioredis';
import { PackageUtils } from '../../../../utils/package-loader';
import { PrefixedManager } from '../prefixed-manager.abstract';
import {
  CacheValue,
  ICacheManager,
  ICacheManagerCollection,
  ICacheManagerMap,
  SetOptions,
} from '../cache.manager.interface';
import { IORedisCacheMap } from './ioredis-cache.map';
import { IORedisCacheCollection } from './ioredis-cache.collection';
import { ICacheValueSerializer } from '../../serializers/types';
import { JsonSerializer } from '../../serializers/json.serializer';
import type { RedisOptions } from 'ioredis';

export type IIORedisOptions = RedisOptions;

export class IORedisCacheManager<T extends CacheValue> extends PrefixedManager implements ICacheManager<T> {
  private readonly serializer: ICacheValueSerializer;

  private constructor(private readonly redisManager: Redis, prefix = '') {
    super(prefix);

    this.serializer = new JsonSerializer();
  }

  static async create<T extends CacheValue>(options?: IIORedisOptions, prefix = ''): Promise<IORedisCacheManager<T>> {
    const RedisCtor = PackageUtils.loadPackage<any>('ioredis');

    return new IORedisCacheManager<T>(new RedisCtor(options), prefix);
  }

  public async set<V extends T>(key: string, data: V, options?: SetOptions): Promise<void> {
    if (options?.expiresInSeconds) {
      await this.redisManager.set(this.withPrefix(key), JSON.stringify(data), 'EX', options.expiresInSeconds);
    } else {
      await this.redisManager.set(this.withPrefix(key), JSON.stringify(data));
    }
  }

  public async get<V extends T>(key: string): Promise<V | null> {
    const stringifiedData = await this.redisManager.get(this.withPrefix(key));
    return stringifiedData ? JSON.parse(stringifiedData) : null;
  }

  public async del(key: string[]): Promise<void> {
    if (key.length) {
      await this.redisManager.del(key.map(this.withPrefix.bind(this)));
    }
  }

  async expire(keys: string[], ttlMs: number): Promise<void> {
    for (const key of keys) {
      await this.redisManager.pexpire(this.withPrefix(key), ttlMs);
    }
  }

  forScope<S extends CacheValue>(prefix?: string): ICacheManager<S> {
    return new IORedisCacheManager<S>(this.redisManager, prefix ?? this.prefix);
  }

  map(key: string): ICacheManagerMap<T> {
    return new IORedisCacheMap(this.withPrefix(key), this.redisManager, this.serializer);
  }

  collection(key: string): ICacheManagerCollection<T> {
    return new IORedisCacheCollection(this.withPrefix(key), this.redisManager, this.serializer);
  }

  async close(): Promise<void> {
    await this.redisManager.quit();
  }
}