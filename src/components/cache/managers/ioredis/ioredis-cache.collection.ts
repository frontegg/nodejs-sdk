import IORedis from 'ioredis';
import { ICacheValueSerializer } from '../../serializers/types';
import { CacheValue, ICacheManagerCollection } from '../cache.manager.interface';

export class IORedisCacheCollection implements ICacheManagerCollection<CacheValue> {
  constructor(
    private readonly key: string,
    private readonly redis: IORedis,
    private readonly serializer: ICacheValueSerializer
  ) {
  }

  async set<T extends CacheValue>(value: T): Promise<void> {
    await this.redis.sadd(this.key, this.serializer.serialize(value));
  }

  async has<T extends CacheValue>(value: T): Promise<boolean> {
    return await this.redis.sismember(this.key, this.serializer.serialize(value)) > 0;
  }

  async getAll<T extends CacheValue>(): Promise<Set<T>> {
    const members = (await this.redis.smembers(this.key)).map(v => this.serializer.deserialize<T>(v));

    return new Set(members);
  }
}