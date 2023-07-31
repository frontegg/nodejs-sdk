import { ICacheManager, SetOptions } from './cache.manager.interface';
import { PackageUtils } from '../../../utils/package-loader';
import { PrefixedManager } from './prefixed-manager.abstract';
import type { Redis } from 'ioredis';

export interface IIORedisOptions {
  host: string;
  password?: string;
  port: number;
  db?: number;
}

export class IORedisCacheManager<T> extends PrefixedManager implements ICacheManager<T> {
  private constructor(private readonly redisManager: Redis, prefix = '') {
    super(prefix);
  }

  static async create<T>(options?: IIORedisOptions, prefix = ''): Promise<IORedisCacheManager<T>> {
    const RedisCtor = PackageUtils.loadPackage<any>('ioredis');

    return new IORedisCacheManager<T>(new RedisCtor(options), prefix);
  }

  public async set<T>(key: string, data: T, options?: SetOptions): Promise<void> {
    if (options?.expiresInSeconds) {
      this.redisManager.set(this.withPrefix(key), JSON.stringify(data), 'EX', options.expiresInSeconds);
    } else {
      this.redisManager.set(this.withPrefix(key), JSON.stringify(data));
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

  forScope<S>(prefix?: string): ICacheManager<S> {
    return new IORedisCacheManager(this.redisManager, prefix ?? this.prefix);
  }
}
