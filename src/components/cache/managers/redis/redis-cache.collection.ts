import { RedisClientType } from 'redis';
import { ICacheValueSerializer } from '../../serializers/types';
import { CacheValue, ICacheManagerCollection } from '../cache.manager.interface';

export class RedisCacheCollection implements ICacheManagerCollection<CacheValue> {
  constructor(
    private readonly key: string,
    private readonly redis: RedisClientType,
    private readonly serializer: ICacheValueSerializer,
  ) {}

  async set<T extends CacheValue>(value: T): Promise<void> {
    await this.redis.SADD(this.key, this.serializer.serialize(value));
  }

  async has<T extends CacheValue>(value: T): Promise<boolean> {
    return await this.redis.SISMEMBER(this.key, this.serializer.serialize(value));
  }

  async getAll<T extends CacheValue>(): Promise<Set<T>> {
    const members = (await this.redis.SMEMBERS(this.key)).map((v) => this.serializer.deserialize<T>(v));

    return new Set(members);
  }
}
