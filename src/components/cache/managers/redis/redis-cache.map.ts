import { RedisClientType } from 'redis';
import { ICacheValueSerializer } from '../../serializers/types';
import { ICacheManagerMap } from '../cache.manager.interface';

export class RedisCacheMap implements ICacheManagerMap {
  constructor(
    private readonly key: string,
    private readonly redis: RedisClientType,
    private readonly serializer: ICacheValueSerializer
  ) {
  }

  async set<T>(field: string, data: T): Promise<void> {
    await this.redis.HSET(this.key, field, this.serializer.serialize(data));
  }

  async get<T>(field: string): Promise<T | null> {
    const raw = await this.redis.HGET(this.key, field);

    return raw !== undefined ?
      this.serializer.deserialize<T>(raw) :
      null;
  }

  async del(field: string): Promise<void> {
    await this.redis.HDEL(this.key, field);
  }
}