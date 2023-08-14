import 'jest-extended';
import { IORedisLockHandler } from './ioredis.lock-handler';
import { RedisLockHandler } from './redis.lock-handler';
import IORedis from 'ioredis';
import { ILockHandler } from './types';
import { createClient, RedisClientType } from 'redis';

let testRedisConnection: IORedis;

const RESOURCE_KEY = 'key_to_lock';

beforeAll(() => {
  testRedisConnection = new IORedis(36279, 'localhost');
});

afterEach(async () => {
  await testRedisConnection.del(RESOURCE_KEY);
});

describe.each([
  {
    classname: IORedisLockHandler.name,
    factory: async () => {
      const redis = new IORedis(36279, 'localhost');

      return {
        instance: new IORedisLockHandler(redis),
        closeFn: () => redis.quit(),
      };
    },
  },
  {
    classname: RedisLockHandler.name,
    factory: async () => {
      const redis: RedisClientType = createClient({ url: 'redis://localhost:36279' });
      await redis.connect();

      return {
        instance: new RedisLockHandler(redis),
        closeFn: () => redis.quit(),
      };
    },
  },
])('$classname lock handler', ({ factory }) => {
  let cut: ILockHandler;
  let close: () => Promise<any>;

  beforeAll(async () => {
    const { instance, closeFn } = await factory();

    cut = instance;
    close = closeFn;
  });

  describe('given the resource is not locked', () => {
    it('when .tryToLockLeaderResource(..) is called, then it resolves to TRUE and given value is written to resource key with given TTL.', async () => {
      // when & then
      await expect(cut.tryToLockLeaderResource(RESOURCE_KEY, 'bar', 1000)).resolves.toBeTruthy();

      // then
      await expect(testRedisConnection.get(RESOURCE_KEY)).resolves.toEqual('bar');

      // and: key is about to expire
      await expect(testRedisConnection.pttl(RESOURCE_KEY)).resolves.toBeWithin(0, 1000);
    });

    it('when .tryToMaintainTheLock(..) is called, then it resolves to FALSE and no value is written to resource key.', async () => {
      // when & then
      await expect(cut.tryToMaintainTheLock(RESOURCE_KEY, 'bar', 1000)).resolves.toBeFalsy();

      // then
      await expect(testRedisConnection.exists(RESOURCE_KEY)).resolves.toEqual(0);
    });
  });

  describe('given the resource is already locked', () => {
    const ALREADY_LOCKED_VALUE = 'foo';

    beforeEach(async () => {
      // given
      await testRedisConnection.set(RESOURCE_KEY, ALREADY_LOCKED_VALUE);
    });

    it('when .tryToLockLeaderResource(..) is called, then it resolves to FALSE and resource identifier is not changed.', async () => {
      // when & then
      await expect(cut.tryToLockLeaderResource(RESOURCE_KEY, 'bar', 1000)).resolves.toBeFalsy();

      // then
      await expect(testRedisConnection.get(RESOURCE_KEY)).resolves.toEqual('foo');
    });

    describe('when .tryToMaintainTheLock(..) is called', () => {
      it('with the same value as already stored, then it resolves to TRUE and the resource TTL is updated.', async () => {
        // when & then
        await expect(cut.tryToMaintainTheLock(RESOURCE_KEY, ALREADY_LOCKED_VALUE, 1000)).resolves.toBeTruthy();

        // then: key is about to expire
        const pttl = await testRedisConnection.pttl(RESOURCE_KEY);
        expect(pttl).toBeGreaterThan(0);
        expect(pttl).toBeLessThanOrEqual(1000);

        // and: the value is the same
        await expect(testRedisConnection.get(RESOURCE_KEY)).resolves.toEqual(ALREADY_LOCKED_VALUE);
      });

      it('with different value than already stored, then it resolves to FALSE and the resource is intact.', async () => {
        // when & then
        await expect(cut.tryToMaintainTheLock(RESOURCE_KEY, 'bar', 1000)).resolves.toBeFalsy();

        // then: key is still in non-expiry mode
        await expect(testRedisConnection.pttl(RESOURCE_KEY)).resolves.toEqual(-1);

        // and: the value is the same
        await expect(testRedisConnection.get(RESOURCE_KEY)).resolves.toEqual(ALREADY_LOCKED_VALUE);
      });
    });
  });

  afterAll(() => close());
});

afterAll(() => testRedisConnection.quit());
