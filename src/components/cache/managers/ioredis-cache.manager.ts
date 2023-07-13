import { ICacheManager, SetOptions } from './cache.manager.interface';
import { PackageUtils } from '../../../utils/package-loader';

export interface IIORedisOptions {
  host: string;
  password: string;
  port: number;
  db: number;
}

export class IORedisCacheManager implements ICacheManager {
  private redisManager: any;

  constructor(options: IIORedisOptions) {
    const RedisInstance = PackageUtils.loadPackage('ioredis') as any;
    this.redisManager = new RedisInstance(options);
  }

  public async set<T>(key: string, data: T, options?: SetOptions): Promise<void> {
    if (options?.expiresInSeconds) {
      this.redisManager.set(key, JSON.stringify(data), 'EX', options.expiresInSeconds);
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
