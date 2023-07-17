import { RedisClientType } from 'redis';
import { ICacheValueSerializer } from '../../serializers/types';
import { ICacheManagerCollection } from '../cache.manager.interface';

export class RedisCacheCollection implements ICacheManagerCollection {
  constructor(
    private readonly key: string,
    private readonly redis: RedisClientType,
    private readonly serializer: ICacheValueSerializer
  ) {
  }

  async set<T>(value: T): Promise<void> {
    await this.redis.SADD(this.key, this.serializer.serialize(value));
  }

  async has<T>(value: T): Promise<boolean> {
    return await this.redis.SISMEMBER(this.key, this.serializer.serialize(value));
  }

  async getAll<T>(): Promise<T[]> {
    return (await this.redis.SMEMBERS(this.key)).map(v => this.serializer.deserialize(v));
  }
}