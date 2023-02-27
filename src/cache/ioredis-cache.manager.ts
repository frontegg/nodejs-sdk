import { ICacheManager, SetOptions } from './cache.manager.interface';
import { PackageUtils } from '../utils/package-loader';
import { IIORedisCacheOptions } from './types';

export class IORedisCacheManager<T> implements ICacheManager<T> {
  private redisManager: any;

  constructor(options: IIORedisCacheOptions) {
    const RedisInstance = PackageUtils.loadPackage('ioredis') as any;
    this.redisManager = new RedisInstance(options);
  }

  public async set(key: string, data: T, options?: SetOptions): Promise<void> {
    if (options?.expiresInSeconds) {
      this.redisManager.set(key, JSON.stringify(data), 'EX', options.expiresInSeconds);
    } else {
      this.redisManager.set(key, JSON.stringify(data));
    }
  }

  public async get(key: string): Promise<T | null> {
    const stringifiedData = await this.redisManager.get(key);
    return stringifiedData ? JSON.parse(stringifiedData) : null;
  }

  public async del(key: string[]): Promise<void> {
    if (key.length) {
      await this.redisManager.del(key);
    }
  }
}
