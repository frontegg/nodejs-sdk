import type IORedis from "ioredis";
import { ICacheValueSerializer } from '../../serializers/types';
import { ICacheManagerMap, CacheValue } from '../cache.manager.interface';

export class IORedisCacheMap implements ICacheManagerMap<CacheValue> {
  constructor(
    private readonly key: string,
    private readonly redis: IORedis,
    private readonly serializer: ICacheValueSerializer
  ) {
  }

  async set<T extends CacheValue>(field: string, data: T): Promise<void> {
    await this.redis.hset(this.key, field, this.serializer.serialize(data));
  }

  async get<T extends CacheValue>(field: string): Promise<T | null> {
    const raw = await this.redis.hget(this.key, field);

    return raw !== null ?
      this.serializer.deserialize<T>(raw) :
      null;
  }

  async del(field: string): Promise<void> {
    await this.redis.hdel(this.key, field);
  }
}