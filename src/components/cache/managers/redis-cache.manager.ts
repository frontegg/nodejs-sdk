import { ICacheManager, SetOptions } from './cache.manager.interface';
import { PackageUtils } from '../../../utils/package-loader';
import Logger from '../../logger';

import type * as Redis from 'redis';
import { PrefixedManager } from './prefixed-manager.abstract';

export interface IRedisOptions {
  url: string;
}

export class RedisCacheManager<T> extends PrefixedManager implements ICacheManager<T> {
  private readonly isReadyPromise: Promise<void>;

  private constructor(
    private readonly redisManager: Redis.RedisClientType,
    prefix = ''
  ) {
    super(prefix);

    this.isReadyPromise = this.redisManager.connect();
    this.isReadyPromise.catch((e) => Logger.error('Failed to connect to redis', e));
  }

  static create<Scope>(options: IRedisOptions, prefix = ''): Promise<RedisCacheManager<Scope>> {
    const { createClient } = PackageUtils.loadPackage('redis') as typeof Redis;

    return new RedisCacheManager<Scope>(
      createClient(options),
      prefix
    ).ready();
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

  forScope<Scope>(prefix?: string): ICacheManager<Scope> {
    return new RedisCacheManager<Scope>(
      this.redisManager,
      prefix ?? this.prefix
    );
  }
}
