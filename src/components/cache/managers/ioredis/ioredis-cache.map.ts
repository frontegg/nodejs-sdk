import type IORedis from "ioredis";
import { ICacheValueSerializer } from '../../serializers/types';
import { ICacheManagerMap } from '../cache.manager.interface';

export class IORedisCacheMap implements ICacheManagerMap {
  constructor(
    private readonly key: string,
    private readonly redis: IORedis,
    private readonly serializer: ICacheValueSerializer
  ) {
  }

  async set<T>(field: string, data: T): Promise<void> {
    await this.redis.hset(this.key, field, this.serializer.serialize(data));
  }

  async get<T>(field: string): Promise<T | null> {
    const raw = await this.redis.hget(this.key, field);

    return raw !== null ?
      this.serializer.deserialize<T>(raw) :
      null;
  }

  async del(field: string): Promise<void> {
    await this.redis.hdel(this.key, field);
  }
}