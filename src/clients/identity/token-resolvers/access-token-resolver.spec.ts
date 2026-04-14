import { AccessTokenResolver } from './access-token-resolver';
import { AuthHeaderType, tokenTypes, IAccessToken, IEntityWithRoles } from '../types';
import { FailedToAuthenticateException } from '../exceptions';
import { FronteggContext } from '../../../components/frontegg-context';
import * as jsonwebtoken from 'jsonwebtoken';

jest.mock('jsonwebtoken');
jest.mock('../../../authenticator');
jest.mock('../../../components/frontegg-context');
jest.mock('../../../components/logger');

describe('AccessTokenResolver', () => {
  let resolver: AccessTokenResolver;
  const mockVerify = jsonwebtoken.verify as jest.Mock;

  const fakePublicKey = 'fake-public-key';
  const fakeToken = 'fake-token';

  const fakeTenantAccessToken: IAccessToken = {
    sub: 'token-123',
    tenantId: 'tenant-123',
    type: tokenTypes.TenantAccessToken,
  };

  const fakeUserAccessToken: IAccessToken = {
    sub: 'token-456',
    tenantId: 'tenant-123',
    type: tokenTypes.UserAccessToken,
  };

  const fakeEntityWithRoles: IEntityWithRoles = {
    sub: 'token-123',
    tenantId: 'tenant-123',
    type: tokenTypes.TenantAccessToken,
    roles: ['admin'],
    permissions: ['read'],
  };

  beforeEach(() => {
    resolver = new AccessTokenResolver();
    jest.clearAllMocks();

    (FronteggContext.getContext as jest.Mock).mockReturnValue({
      FRONTEGG_CLIENT_ID: 'test-client-id',
      FRONTEGG_API_KEY: 'test-api-key',
    });

    (FronteggContext.getOptions as jest.Mock).mockReturnValue({
      accessTokensOptions: {},
    });
  });

  describe('shouldHandle', () => {
    it('should return true for AuthHeaderType.AccessToken', () => {
      expect(resolver.shouldHandle(AuthHeaderType.AccessToken)).toBe(true);
    });

    it('should return false for AuthHeaderType.JWT', () => {
      expect(resolver.shouldHandle(AuthHeaderType.JWT)).toBe(false);
    });
  });

  describe('validateToken', () => {
    beforeEach(() => {
      mockVerify.mockImplementation((_token, _key, _opts, callback) => {
        callback(null, fakeTenantAccessToken);
      });
    });

    it('should call jsonwebtoken.verify with the token and public key', async () => {
      const mockGetActiveIds = jest.fn().mockResolvedValue(['token-123']);
      const mockGetEntity = jest.fn().mockResolvedValue(fakeEntityWithRoles);

      Reflect.set(resolver, 'accessTokenServices', [
        {
          shouldHandle: (type: tokenTypes) => type === tokenTypes.TenantAccessToken,
          getEntity: mockGetEntity,
          getActiveAccessTokenIds: mockGetActiveIds,
        },
      ]);

      await resolver.validateToken(fakeToken, fakePublicKey);

      expect(mockVerify).toHaveBeenCalledWith(
        fakeToken,
        fakePublicKey,
        { algorithms: ['RS256'] },
        expect.any(Function),
      );
    });

    it('should throw FailedToAuthenticateException when token is not in active ids', async () => {
      const mockGetActiveIds = jest.fn().mockResolvedValue(['other-token']);

      Reflect.set(resolver, 'accessTokenServices', [
        {
          shouldHandle: (type: tokenTypes) => type === tokenTypes.TenantAccessToken,
          getEntity: jest.fn(),
          getActiveAccessTokenIds: mockGetActiveIds,
        },
      ]);

      try {
        await resolver.validateToken(fakeToken, fakePublicKey);
        fail('Expected FailedToAuthenticateException to be thrown');
      } catch (e) {
        expect(e).toBeInstanceOf(FailedToAuthenticateException);
      }
    });

    it('should fetch entity roles when withRolesAndPermissions is set', async () => {
      const mockGetEntity = jest.fn().mockResolvedValue(fakeEntityWithRoles);
      const mockGetActiveIds = jest.fn().mockResolvedValue(['token-123']);

      Reflect.set(resolver, 'accessTokenServices', [
        {
          shouldHandle: (type: tokenTypes) => type === tokenTypes.TenantAccessToken,
          getEntity: mockGetEntity,
          getActiveAccessTokenIds: mockGetActiveIds,
        },
      ]);

      const result = await resolver.validateToken(fakeToken, fakePublicKey, {
        withRolesAndPermissions: true,
      });

      expect(mockGetEntity).toHaveBeenCalledWith(fakeTenantAccessToken);
      expect(result).toEqual(expect.objectContaining({
        sub: 'token-123',
        roles: ['admin'],
        permissions: ['read'],
      }));
    });

    it('should validate roles and permissions when options contain roles', async () => {
      const mockGetEntity = jest.fn().mockResolvedValue(fakeEntityWithRoles);

      Reflect.set(resolver, 'accessTokenServices', [
        {
          shouldHandle: (type: tokenTypes) => type === tokenTypes.TenantAccessToken,
          getEntity: mockGetEntity,
          getActiveAccessTokenIds: jest.fn(),
        },
      ]);

      const result = await resolver.validateToken(fakeToken, fakePublicKey, {
        roles: ['admin'],
      });

      expect(mockGetEntity).toHaveBeenCalledWith(fakeTenantAccessToken);
      expect(result).toBeDefined();
    });

    it('should route to correct service based on token type', async () => {
      const tenantService = {
        shouldHandle: (type: tokenTypes) => type === tokenTypes.TenantAccessToken,
        getEntity: jest.fn().mockResolvedValue(fakeEntityWithRoles),
        getActiveAccessTokenIds: jest.fn().mockResolvedValue(['token-123']),
      };
      const userService = {
        shouldHandle: (type: tokenTypes) => type === tokenTypes.UserAccessToken,
        getEntity: jest.fn(),
        getActiveAccessTokenIds: jest.fn().mockResolvedValue([]),
      };

      Reflect.set(resolver, 'accessTokenServices', [tenantService, userService]);

      await resolver.validateToken(fakeToken, fakePublicKey);

      expect(tenantService.getActiveAccessTokenIds).toHaveBeenCalled();
      expect(userService.getActiveAccessTokenIds).not.toHaveBeenCalled();
    });

    it('should throw FailedToAuthenticateException when no service matches token type', async () => {
      Reflect.set(resolver, 'accessTokenServices', [
        {
          shouldHandle: () => false,
          getEntity: jest.fn(),
          getActiveAccessTokenIds: jest.fn(),
        },
      ]);

      try {
        await resolver.validateToken(fakeToken, fakePublicKey);
        fail('Expected FailedToAuthenticateException to be thrown');
      } catch (e) {
        expect(e).toBeInstanceOf(FailedToAuthenticateException);
      }
    });
  });
});
