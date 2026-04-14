import { CacheTenantAccessTokenService } from './cache-tenant-access-token.service';
import { CacheUserAccessTokenService } from './cache-user-access-token.service';
import { ICacheManager } from '../../../../../cache/cache.manager.interface';
import {
  IEmptyAccessToken,
  IEntityWithRoles,
  ITenantAccessToken,
  IUserAccessToken,
  tokenTypes,
} from '../../../types';
import { FailedToAuthenticateException } from '../../../exceptions';
import { AccessTokenService } from '../services/access-token.service';

function createMockCacheManager<T>(): jest.Mocked<ICacheManager<T>> {
  return {
    get: jest.fn().mockResolvedValue(null),
    set: jest.fn().mockResolvedValue(undefined),
    del: jest.fn().mockResolvedValue(undefined),
  };
}

function createMockAccessTokenService(
  type: tokenTypes.TenantAccessToken | tokenTypes.UserAccessToken = tokenTypes.TenantAccessToken,
): any {
  return {
    getEntity: jest.fn(),
    getActiveAccessTokenIds: jest.fn(),
    shouldHandle: jest.fn(),
    getEntityFromIdentity: jest.fn(),
    getActiveAccessTokenIdsFromIdentity: jest.fn(),
    httpClient: {} as any,
    type,
  };
}

describe('CacheTenantAccessTokenService', () => {
  let service: CacheTenantAccessTokenService;
  let entityCacheManager: jest.Mocked<ICacheManager<IEntityWithRoles | IEmptyAccessToken>>;
  let activeIdsCacheManager: jest.Mocked<ICacheManager<string[]>>;
  let innerService: any;

  const fakeEntity: ITenantAccessToken = {
    sub: 'token-123',
    tenantId: 'tenant-456',
    type: tokenTypes.TenantAccessToken,
  };

  const fakeEntityWithRoles: IEntityWithRoles = {
    sub: 'token-123',
    tenantId: 'tenant-456',
    type: tokenTypes.TenantAccessToken,
    roles: ['admin'],
    permissions: ['read'],
  };

  beforeEach(() => {
    entityCacheManager = createMockCacheManager();
    activeIdsCacheManager = createMockCacheManager();
    innerService = createMockAccessTokenService();
    service = new CacheTenantAccessTokenService(entityCacheManager, activeIdsCacheManager, innerService);
  });

  describe('shouldHandle', () => {
    it('should return true for TenantAccessToken type', () => {
      expect(service.shouldHandle(tokenTypes.TenantAccessToken)).toBe(true);
    });

    it('should return false for UserAccessToken type', () => {
      expect(service.shouldHandle(tokenTypes.UserAccessToken)).toBe(false);
    });
  });

  describe('getEntity', () => {
    it('should return cached value without calling inner service on cache hit', async () => {
      entityCacheManager.get.mockResolvedValue(fakeEntityWithRoles);

      const result = await service.getEntity(fakeEntity);

      expect(result).toEqual(fakeEntityWithRoles);
      expect(innerService.getEntity).not.toHaveBeenCalled();
    });

    it('should call inner service and cache result on cache miss', async () => {
      entityCacheManager.get.mockResolvedValue(null);
      innerService.getEntity.mockResolvedValue(fakeEntityWithRoles);

      const result = await service.getEntity(fakeEntity);

      expect(result).toEqual(fakeEntityWithRoles);
      expect(innerService.getEntity).toHaveBeenCalledWith(fakeEntity);
      expect(entityCacheManager.set).toHaveBeenCalledWith(
        expect.any(String),
        fakeEntityWithRoles,
        { expiresInSeconds: 10 },
      );
    });

    it('should cache { empty: true } when inner service throws FailedToAuthenticateException', async () => {
      entityCacheManager.get.mockResolvedValue(null);
      innerService.getEntity.mockRejectedValue(new FailedToAuthenticateException());

      try {
        await service.getEntity(fakeEntity);
        fail('Expected FailedToAuthenticateException to be thrown');
      } catch (e) {
        expect(e).toBeInstanceOf(FailedToAuthenticateException);
        expect(entityCacheManager.set).toHaveBeenCalledWith(
          expect.any(String),
          { empty: true },
          { expiresInSeconds: 10 },
        );
      }
    });

    it('should throw FailedToAuthenticateException when cached value is { empty: true }', async () => {
      entityCacheManager.get.mockResolvedValue({ empty: true });

      try {
        await service.getEntity(fakeEntity);
        fail('Expected FailedToAuthenticateException to be thrown');
      } catch (e) {
        expect(e).toBeInstanceOf(FailedToAuthenticateException);
        expect(innerService.getEntity).not.toHaveBeenCalled();
      }
    });

    it('should not cache when inner service throws a non-FailedToAuthenticateException error', async () => {
      entityCacheManager.get.mockResolvedValue(null);
      innerService.getEntity.mockRejectedValue(new Error('some other error'));

      try {
        await service.getEntity(fakeEntity);
        fail('Expected error to be thrown');
      } catch (e) {
        expect(entityCacheManager.set).not.toHaveBeenCalled();
      }
    });
  });

  describe('getActiveAccessTokenIds', () => {
    it('should return cached value without calling inner service on cache hit', async () => {
      const cachedIds = ['id-1', 'id-2'];
      activeIdsCacheManager.get.mockResolvedValue(cachedIds);

      const result = await service.getActiveAccessTokenIds();

      expect(result).toEqual(cachedIds);
      expect(innerService.getActiveAccessTokenIds).not.toHaveBeenCalled();
    });

    it('should call inner service and cache result on cache miss', async () => {
      const activeIds = ['id-1', 'id-2'];
      activeIdsCacheManager.get.mockResolvedValue(null);
      innerService.getActiveAccessTokenIds.mockResolvedValue(activeIds);

      const result = await service.getActiveAccessTokenIds();

      expect(result).toEqual(activeIds);
      expect(innerService.getActiveAccessTokenIds).toHaveBeenCalled();
      expect(activeIdsCacheManager.set).toHaveBeenCalledWith(
        expect.any(String),
        activeIds,
        { expiresInSeconds: 10 },
      );
    });

    it('should cache empty array when inner service throws FailedToAuthenticateException', async () => {
      activeIdsCacheManager.get.mockResolvedValue(null);
      innerService.getActiveAccessTokenIds.mockRejectedValue(new FailedToAuthenticateException());

      try {
        await service.getActiveAccessTokenIds();
        fail('Expected FailedToAuthenticateException to be thrown');
      } catch (e) {
        expect(e).toBeInstanceOf(FailedToAuthenticateException);
        expect(activeIdsCacheManager.set).toHaveBeenCalledWith(
          expect.any(String),
          [],
          { expiresInSeconds: 10 },
        );
      }
    });
  });
});

describe('CacheUserAccessTokenService', () => {
  let service: CacheUserAccessTokenService;
  let entityCacheManager: jest.Mocked<ICacheManager<IEntityWithRoles | IEmptyAccessToken>>;
  let activeIdsCacheManager: jest.Mocked<ICacheManager<string[]>>;
  let innerService: any;

  const fakeEntity: IUserAccessToken = {
    sub: 'token-789',
    tenantId: 'tenant-456',
    type: tokenTypes.UserAccessToken,
    userId: 'user-123',
  };

  const fakeEntityWithRoles: IEntityWithRoles = {
    sub: 'token-789',
    tenantId: 'tenant-456',
    type: tokenTypes.UserAccessToken,
    roles: ['viewer'],
    permissions: ['read'],
  };

  beforeEach(() => {
    entityCacheManager = createMockCacheManager();
    activeIdsCacheManager = createMockCacheManager();
    innerService = createMockAccessTokenService(tokenTypes.UserAccessToken);
    service = new CacheUserAccessTokenService(entityCacheManager, activeIdsCacheManager, innerService);
  });

  describe('shouldHandle', () => {
    it('should return true for UserAccessToken type', () => {
      expect(service.shouldHandle(tokenTypes.UserAccessToken)).toBe(true);
    });

    it('should return false for TenantAccessToken type', () => {
      expect(service.shouldHandle(tokenTypes.TenantAccessToken)).toBe(false);
    });
  });

  describe('getEntity', () => {
    it('should return cached value without calling inner service on cache hit', async () => {
      entityCacheManager.get.mockResolvedValue(fakeEntityWithRoles);

      const result = await service.getEntity(fakeEntity);

      expect(result).toEqual(fakeEntityWithRoles);
      expect(innerService.getEntity).not.toHaveBeenCalled();
    });

    it('should call inner service and cache result on cache miss', async () => {
      entityCacheManager.get.mockResolvedValue(null);
      innerService.getEntity.mockResolvedValue(fakeEntityWithRoles);

      const result = await service.getEntity(fakeEntity);

      expect(result).toEqual(fakeEntityWithRoles);
      expect(innerService.getEntity).toHaveBeenCalledWith(fakeEntity);
      expect(entityCacheManager.set).toHaveBeenCalledWith(
        expect.any(String),
        fakeEntityWithRoles,
        { expiresInSeconds: 10 },
      );
    });

    it('should cache { empty: true } when inner service throws FailedToAuthenticateException', async () => {
      entityCacheManager.get.mockResolvedValue(null);
      innerService.getEntity.mockRejectedValue(new FailedToAuthenticateException());

      try {
        await service.getEntity(fakeEntity);
        fail('Expected FailedToAuthenticateException to be thrown');
      } catch (e) {
        expect(e).toBeInstanceOf(FailedToAuthenticateException);
        expect(entityCacheManager.set).toHaveBeenCalledWith(
          expect.any(String),
          { empty: true },
          { expiresInSeconds: 10 },
        );
      }
    });

    it('should throw FailedToAuthenticateException when cached value is { empty: true }', async () => {
      entityCacheManager.get.mockResolvedValue({ empty: true });

      try {
        await service.getEntity(fakeEntity);
        fail('Expected FailedToAuthenticateException to be thrown');
      } catch (e) {
        expect(e).toBeInstanceOf(FailedToAuthenticateException);
        expect(innerService.getEntity).not.toHaveBeenCalled();
      }
    });
  });

  describe('getActiveAccessTokenIds', () => {
    it('should return cached value without calling inner service on cache hit', async () => {
      const cachedIds = ['id-3', 'id-4'];
      activeIdsCacheManager.get.mockResolvedValue(cachedIds);

      const result = await service.getActiveAccessTokenIds();

      expect(result).toEqual(cachedIds);
      expect(innerService.getActiveAccessTokenIds).not.toHaveBeenCalled();
    });

    it('should call inner service and cache result on cache miss', async () => {
      const activeIds = ['id-3', 'id-4'];
      activeIdsCacheManager.get.mockResolvedValue(null);
      innerService.getActiveAccessTokenIds.mockResolvedValue(activeIds);

      const result = await service.getActiveAccessTokenIds();

      expect(result).toEqual(activeIds);
      expect(innerService.getActiveAccessTokenIds).toHaveBeenCalled();
      expect(activeIdsCacheManager.set).toHaveBeenCalledWith(
        expect.any(String),
        activeIds,
        { expiresInSeconds: 10 },
      );
    });

    it('should cache empty array when inner service throws FailedToAuthenticateException', async () => {
      activeIdsCacheManager.get.mockResolvedValue(null);
      innerService.getActiveAccessTokenIds.mockRejectedValue(new FailedToAuthenticateException());

      try {
        await service.getActiveAccessTokenIds();
        fail('Expected FailedToAuthenticateException to be thrown');
      } catch (e) {
        expect(e).toBeInstanceOf(FailedToAuthenticateException);
        expect(activeIdsCacheManager.set).toHaveBeenCalledWith(
          expect.any(String),
          [],
          { expiresInSeconds: 10 },
        );
      }
    });
  });
});
