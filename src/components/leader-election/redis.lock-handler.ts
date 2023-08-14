import { ILockHandler } from './types';
import { RedisClientType } from 'redis';

export class RedisLockHandler implements ILockHandler {
  constructor(private readonly redis: RedisClientType) {}

  private static EXTEND_LEADERSHIP_SCRIPT =
    "if redis.call('GET', KEYS[1]) == ARGV[1] then return redis.call('PEXPIRE', KEYS[1], ARGV[2]) else return 0 end";

  async tryToMaintainTheLock(key: string, value: string, expirationTimeMs: number): Promise<boolean> {
    const extended = await this.redis.EVAL(RedisLockHandler.EXTEND_LEADERSHIP_SCRIPT, {
      keys: [key],
      arguments: [value, expirationTimeMs.toString()],
    });

    return (extended as number) > 0;
  }

  async tryToLockLeaderResource(key: string, value: string, expirationTimeMs: number): Promise<boolean> {
    return (await this.redis.SET(key, value, { PX: expirationTimeMs, NX: true })) !== null;
  }
}
