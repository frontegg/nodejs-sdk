import { RedisClientType } from 'redis';
import { ICacheValueSerializer } from '../../serializers/types';
import { CacheValue, ICacheManagerMap } from '../cache.manager.interface';

export class RedisCacheMap implements ICacheManagerMap<CacheValue> {
  constructor(
    private readonly key: string,
    private readonly redis: RedisClientType,
    private readonly serializer: ICacheValueSerializer,
  ) {}

  async set<T extends CacheValue>(field: string, data: T): Promise<void> {
    await this.redis.HSET(this.key, field, this.serializer.serialize(data));
  }

  async get<T extends CacheValue>(field: string): Promise<T | null> {
    const raw = await this.redis.HGET(this.key, field);

    return raw !== undefined ? this.serializer.deserialize<T>(raw) : null;
  }

  async del(field: string): Promise<void> {
    await this.redis.HDEL(this.key, field);
  }
}