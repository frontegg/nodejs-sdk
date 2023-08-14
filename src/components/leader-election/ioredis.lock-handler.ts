import { ILockHandler } from './types';
import IORedis from 'ioredis';

const NUM_OF_KEYS_IN_LUA_SCRIPT = 1;

export class IORedisLockHandler implements ILockHandler {
  constructor(private readonly redis: IORedis) {}

  private static EXTEND_LEADERSHIP_SCRIPT =
    "if redis.call('GET', KEYS[1]) == ARGV[1] then return redis.call('PEXPIRE', KEYS[1], ARGV[2]) else return 0 end";

  async tryToMaintainTheLock(key: string, value: string, expirationTimeMs: number): Promise<boolean> {
    const extended = await this.redis.eval(
      IORedisLockHandler.EXTEND_LEADERSHIP_SCRIPT,
      NUM_OF_KEYS_IN_LUA_SCRIPT,
      key,
      value,
      expirationTimeMs,
    );

    return (extended as number) > 0;
  }

  async tryToLockLeaderResource(key: string, value: string, expirationTimeMs: number): Promise<boolean> {
    return (await this.redis.set(key, value, 'PX', expirationTimeMs, 'NX')) !== null;
  }
}
