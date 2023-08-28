import 'jest-extended';
import IORedis from 'ioredis';
import { RedisCacheManager } from './redis-cache.manager';
import { CacheValue } from '../cache.manager.interface';

// TODO:  define all tests of Redis-based ICacheManager implementations in single file, only change the implementation
//        for runs

function delay(ms: number): Promise<void> {
  return new Promise((r) => setTimeout(r, ms));
}

describe(RedisCacheManager.name, () => {
  let cut: RedisCacheManager<CacheValue>;
  let redisTestConnection: IORedis;

  beforeAll(async () => {
    // initialize test Redis connection
    redisTestConnection = new IORedis(36279, 'localhost');

    // initial clean-up of used key
    await redisTestConnection.del('key');

    cut = await RedisCacheManager.create({ url: 'redis://localhost:36279' });
  });

  afterEach(async () => {
    await redisTestConnection.del('key');
  });

  afterAll(async () => {
    await cut.close();
    await redisTestConnection.quit();
  });

  describe('given simple key/value with key "key"', () => {
    it('when .set("key", "value") is called, then it is stored in Redis as JSON-encoded string.', async () => {
      // when
      await cut.set('key', 'value');

      // then
      await expect(redisTestConnection.get('key')).resolves.toStrictEqual('"value"');
    });

    describe('given .set("key", "value", options) has been called with expiration time, then after expiration', () => {
      beforeEach(() => cut.set('key', 'value', { expiresInSeconds: 1 }));

      it('when expiration time has not passed yet, then it is kept in Redis.', async () => {
        // when
        await delay(100);

        // then
        await expect(redisTestConnection.exists('key')).resolves.toBeGreaterThan(0);
      });

      it('when expiration time has passed already, then it is removed from Redis.', async () => {
        // when
        await delay(1500);

        // then
        await expect(redisTestConnection.exists('key')).resolves.toEqual(0);
      });
    });

    describe('and in Redis key "key" there is JSON-encoded string \'"foo"\' stored', () => {
      beforeEach(() => redisTestConnection.set('key', '"foo"'));

      it('when .get("key") is called, then it resolves to string "foo".', async () => {
        // when
        await expect(cut.get('key')).resolves.toStrictEqual('foo');
      });

      it('when .del("key") is called, then key "key" is removed from Redis DB.', async () => {
        // when
        await cut.del(['key']);

        // then
        await expect(redisTestConnection.exists('key')).resolves.toEqual(0);
      });
    });
  });

  describe('given .map("key") is called', () => {
    it('when map\'s .set("field", "value") is called, then it is stored in Redis Hashset as JSON-encoded string.', async () => {
      // when
      await cut.map('key').set('field', 'value');

      // then
      await expect(redisTestConnection.hget('key', 'field')).resolves.toEqual('"value"');
    });

    describe('and in Redis Hashset with field "foo" is already storing JSON-encoded value \'"bar"\'', () => {
      beforeEach(() => redisTestConnection.hset('key', 'foo', '"bar"'));

      it('when map\'s .get("foo") is called, then it resolves to value "bar".', async () => {
        // when & then
        await expect(cut.map('key').get('foo')).resolves.toStrictEqual('bar');
      });

      it('when map\'s .get("baz") is called, then it resolves to NULL. [non-existing key]', async () => {
        // when & then
        await expect(cut.map('key').get('baz')).resolves.toBeNull();
      });

      it('when map\'s .del("foo") is called, then it drops the field "foo" from hashset "key".', async () => {
        // when
        await expect(cut.map('key').del('foo')).toResolve();

        // then
        await expect(redisTestConnection.hexists('key', 'foo')).resolves.toEqual(0);
      });
    });
  });

  describe('given .collection("key") is called', () => {
    it('when collection\'s .set("value") is called, then it is stored in Redis Set as JSON-encoded string.', async () => {
      // when
      await cut.collection('key').set('value');

      // then
      await expect(redisTestConnection.sismember('key', '"value"')).resolves.toBeTruthy();
    });

    describe('and in Redis Set value JSON-encoded value \'"foo"\' is stored', () => {
      beforeEach(() => redisTestConnection.sadd('key', '"foo"'));

      it('when collection\'s .getAll() is called, then it resolves to the Set instance with value "foo".', async () => {
        // when & then
        await expect(cut.collection('key').getAll()).resolves.toStrictEqual(new Set(['foo']));
      });

      it('when collection\'s .has("foo") is called, then it resolves to TRUE.', async () => {
        // when & then
        await expect(cut.collection('key').has('foo')).resolves.toBeTrue();
      });

      it('when collection\'s .has("non-existing-field") is called, then it resolves to FALSE.', async () => {
        // when & then
        await expect(cut.collection('key').has('non-existing-field')).resolves.toBeFalsy();
      });
    });
  });
});
