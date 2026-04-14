import { RedisCacheManager } from './redis-cache.manager';

const mockSet = jest.fn().mockResolvedValue(undefined);
const mockGet = jest.fn().mockResolvedValue(null);
const mockDel = jest.fn().mockResolvedValue(undefined);
const mockConnect = jest.fn().mockResolvedValue(undefined);

const mockRedisClient = {
  set: mockSet,
  get: mockGet,
  del: mockDel,
  connect: mockConnect,
};

jest.mock('../utils/package-loader', () => ({
  PackageUtils: {
    loadPackage: (name: string) => {
      if (name === 'redis') {
        return {
          createClient: () => mockRedisClient,
        };
      }
      throw new Error(`Unknown package: ${name}`);
    },
  },
}));

describe('RedisCacheManager', () => {
  let cacheManager: RedisCacheManager<{ data: string }>;

  beforeEach(() => {
    jest.clearAllMocks();
    cacheManager = new RedisCacheManager<{ data: string }>({ url: 'redis://localhost:6379' });
  });

  it('should load redis via PackageUtils and create client', () => {
    expect(mockConnect).toHaveBeenCalled();
  });

  describe('set', () => {
    it('should call redis.set with JSON.stringify', async () => {
      const data = { data: 'value' };
      await cacheManager.set('key', data);

      expect(mockSet).toHaveBeenCalledWith('key', JSON.stringify(data));
    });

    it('should call redis.set with EX option when expiresInSeconds is provided', async () => {
      const data = { data: 'value' };
      await cacheManager.set('key', data, { expiresInSeconds: 60 });

      expect(mockSet).toHaveBeenCalledWith('key', JSON.stringify(data), { EX: 60 });
    });
  });

  describe('get', () => {
    it('should return parsed JSON when data exists', async () => {
      const data = { data: 'value' };
      mockGet.mockResolvedValueOnce(JSON.stringify(data));

      const result = await cacheManager.get('key');

      expect(result).toEqual(data);
    });

    it('should return null when data does not exist', async () => {
      mockGet.mockResolvedValueOnce(null);

      const result = await cacheManager.get('key');

      expect(result).toBeNull();
    });
  });

  describe('del', () => {
    it('should call redis.del with keys', async () => {
      await cacheManager.del(['key1', 'key2']);

      expect(mockDel).toHaveBeenCalledWith(['key1', 'key2']);
    });

    it('should not call redis.del when keys array is empty', async () => {
      await cacheManager.del([]);

      expect(mockDel).not.toHaveBeenCalled();
    });
  });
});
