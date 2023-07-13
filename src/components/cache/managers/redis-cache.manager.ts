import { ICacheManager, SetOptions } from './cache.manager.interface';
import { PackageUtils } from '../../../utils/package-loader';
import Logger from '../../logger';

export interface IRedisOptions {
  url: string;
}

export class RedisCacheManager implements ICacheManager {
  private redisManager: any;

  constructor(options: IRedisOptions) {
    const { createClient } = PackageUtils.loadPackage('redis') as any;
    this.redisManager = createClient(options);
    this.redisManager.connect().catch((e) => Logger.error('Failed to connect to redis', e));
  }

  public async set<T>(key: string, data: T, options?: SetOptions): Promise<void> {
    if (options?.expiresInSeconds) {
      this.redisManager.set(key, JSON.stringify(data), { EX: options.expiresInSeconds });
    } else {
      this.redisManager.set(key, JSON.stringify(data));
    }
  }

  public async get<T>(key: string): Promise<T | null> {
    const stringifiedData = await this.redisManager.get(key);
    return stringifiedData ? JSON.parse(stringifiedData) : null;
  }

  public async del(key: string[]): Promise<void> {
    if (key.length) {
      await this.redisManager.del(key);
    }
  }
}
