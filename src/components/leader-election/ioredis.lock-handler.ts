import { ILockHandler } from './types';
import IORedis from 'ioredis';

const NUM_OF_KEYS_IN_LUA_SCRIPT = 1;

export class IORedisLockHandler implements ILockHandler {
  constructor(private readonly redis: IORedis) {}

  private static EXTEND_LEADERSHIP_SCRIPT =
    "if redis.call('GET', KEYS[1]) == ARGV[1] then return redis.call('PEXPIRE', KEYS[1], ARGV[2]) else return 0 end";

  /**
   * This method calls the Lua script that prolongs the lock on given `leadershipResourceKey` only, when stored value
   * equals to given `instanceIdentifier` and then method resolves to `true`.
   *
   * When `leadershipResourceKey` doesn't exist, or it has a different value, then the leadership is not prolonged and
   * method resolves to `false`.
   *
   * Using Lua script ensures the atomicity of the whole process. Without it there is no guarantee that other Redis
   * client doesn't execute operation on `leadershipResourceKey` in-between `GET` and `PEXPIRE` commands.
   */
  async tryToMaintainTheLock(
    leadershipResourceKey: string,
    instanceIdentifier: string,
    expirationTimeMs: number,
  ): Promise<boolean> {
    const extended = await this.redis.eval(
      IORedisLockHandler.EXTEND_LEADERSHIP_SCRIPT,
      NUM_OF_KEYS_IN_LUA_SCRIPT,
      leadershipResourceKey,
      instanceIdentifier,
      expirationTimeMs,
    );

    return (extended as number) > 0;
  }

  /**
   * This stores the `instanceIdentifier` value into `leadershipResourceKey` only, when the key doesn't exist. If value
   * is stored, then TTL is also set to `expirationTimeMs` and method resolves to `true`.
   *
   * Otherwise method resolved to `false` and no change to `leadershipResourceKey` is introduced.
   */
  async tryToLockLeaderResource(
    leadershipResourceKey: string,
    instanceIdentifier: string,
    expirationTimeMs: number,
  ): Promise<boolean> {
    return (await this.redis.set(leadershipResourceKey, instanceIdentifier, 'PX', expirationTimeMs, 'NX')) !== null;
  }
}
