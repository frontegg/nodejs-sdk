import IORedis from 'ioredis';
import { ICacheValueSerializer } from '../../serializers/types';
import { ICacheManagerCollection } from '../cache.manager.interface';

export class IORedisCacheCollection implements ICacheManagerCollection {
  constructor(
    private readonly key: string,
    private readonly redis: IORedis,
    private readonly serializer: ICacheValueSerializer
  ) {
  }

  async set<T>(value: T): Promise<void> {
    await this.redis.sadd(this.key, this.serializer.serialize(value));
  }

  async has<T>(value: T): Promise<boolean> {
    return await this.redis.sismember(this.key, this.serializer.serialize(value)) > 0;
  }

  async getAll<T>(): Promise<T[]> {
    return (await this.redis.smembers(this.key)).map(v => this.serializer.deserialize(v));
  }
}