import { CacheValue, ICacheManager, IORedisCacheManager, RedisCacheManager } from '../cache/managers';
import { ILeadershipElectionGivenOptions } from './types';
import { RedisLockHandler } from './redis.lock-handler';
import { IORedisLockHandler } from './ioredis.lock-handler';
import { AlwaysLeaderLockHandler } from './always-leader.lock-handler';
import { LeaderElection } from './index';

export class LeaderElectionFactory {
  static fromCache<T extends CacheValue>(
    identifier: string,
    manager: ICacheManager<T>,
    options: ILeadershipElectionGivenOptions,
  ): LeaderElection {
    switch (true) {
      case manager instanceof RedisCacheManager:
        return new LeaderElection(
          new RedisLockHandler((manager as RedisCacheManager<T>).getRedis()),
          identifier,
          options,
        );
      case manager instanceof IORedisCacheManager:
        return new LeaderElection(
          new IORedisLockHandler((manager as IORedisCacheManager<T>).getRedis()),
          identifier,
          options,
        );
      default:
        return new LeaderElection(new AlwaysLeaderLockHandler(), identifier, options);
    }
  }
}
