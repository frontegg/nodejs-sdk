import type { Redis } from 'ioredis';
import { PackageUtils } from '../../../../utils/package-loader';
import { PrefixedManager } from '../prefixed-manager.abstract';
import { ICacheManager, ICacheManagerCollection, ICacheManagerMap, SetOptions } from '../cache.manager.interface';
import { IORedisCacheMap } from './ioredis-cache.map';
import { IORedisCacheCollection } from './ioredis-cache.collection';
import { ICacheValueSerializer } from '../../serializers/types';
import { JsonSerializer } from '../../serializers/json.serializer';

export interface IIORedisOptions {
  host: string;
  password?: string;
  port: number;
  db?: number;
}

export class IORedisCacheManager<T> extends PrefixedManager implements ICacheManager<T> {
  private readonly serializer: ICacheValueSerializer;

  private constructor(private readonly redisManager: Redis, prefix = '') {
    super(prefix);

    this.serializer = new JsonSerializer();
  }

  static async create<T>(options?: IIORedisOptions, prefix = ''): Promise<IORedisCacheManager<T>> {
    const RedisCtor = PackageUtils.loadPackage<any>('ioredis');

    return new IORedisCacheManager<T>(new RedisCtor(options), prefix);
  }

  public async set<V extends T>(key: string, data: V, options?: SetOptions): Promise<void> {
    if (options?.expiresInSeconds) {
      this.redisManager.set(this.withPrefix(key), JSON.stringify(data), 'EX', options.expiresInSeconds);
    } else {
      this.redisManager.set(this.withPrefix(key), JSON.stringify(data));
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

  forScope<S>(prefix?: string): ICacheManager<S> {
    return new IORedisCacheManager(this.redisManager, prefix ?? this.prefix);
  }

  hashmap(key: string): ICacheManagerMap {
    return new IORedisCacheMap(this.withPrefix(key), this.redisManager, this.serializer);
  }

  collection(key: string): ICacheManagerCollection {
    return new IORedisCacheCollection(this.withPrefix(key), this.redisManager, this.serializer);
  }
}
