import axios from 'axios';
import MockAdapter from 'axios-mock-adapter';
import { UserAccessTokenService } from './user-access-token.service';
import { HttpClient } from '../../../../http';
import { FronteggAuthenticator } from '../../../../../authenticator';
import { IUserAccessToken, tokenTypes } from '../../../types';
import { FailedToAuthenticateException } from '../../../exceptions';
import { config } from '../../../../../config';

jest.mock('../../../../../authenticator');

describe('UserAccessTokenService', () => {
  let service: UserAccessTokenService;
  let mock: InstanceType<typeof MockAdapter>;
  const authenticator = new FronteggAuthenticator();
  const fakeToken = 'Bearer abc123';

  const fakeEntity: IUserAccessToken = {
    sub: 'token-789',
    tenantId: 'tenant-456',
    type: tokenTypes.UserAccessToken,
    userId: 'user-123',
  };

  beforeAll(async () => {
    mock = new MockAdapter(axios);
    await authenticator.init('test-client', 'test-key');
    Reflect.set(authenticator, 'accessToken', fakeToken);
  });

  afterAll(() => {
    mock.restore();
  });

  beforeEach(() => {
    const httpClient = new HttpClient(authenticator);
    service = new UserAccessTokenService(httpClient);
  });

  afterEach(() => {
    mock.reset();
  });

  describe('shouldHandle', () => {
    it('should return true for UserAccessToken type', () => {
      expect(service.shouldHandle(tokenTypes.UserAccessToken)).toBe(true);
    });

    it('should return false for TenantAccessToken type', () => {
      expect(service.shouldHandle(tokenTypes.TenantAccessToken)).toBe(false);
    });
  });

  describe('getEntityFromIdentity', () => {
    it('should call the correct URL with entity.sub', async () => {
      const responseData = {
        id: 'token-789',
        tenantId: 'tenant-456',
        userId: 'user-123',
        roles: ['viewer'],
        permissions: ['read'],
      };

      const url = `${config.urls.identityService}/resources/vendor-only/users/access-tokens/v1/${fakeEntity.sub}`;
      mock.onGet(url).reply(200, responseData);

      const result = await service.getEntityFromIdentity(fakeEntity);

      expect(result).toEqual({
        ...fakeEntity,
        roles: ['viewer'],
        permissions: ['read'],
      });
    });
  });

  describe('getActiveAccessTokenIdsFromIdentity', () => {
    it('should call the correct URL and return active ids', async () => {
      const activeIds = ['token-789', 'token-012'];
      const url = `${config.urls.identityService}/resources/vendor-only/users/access-tokens/v1/active`;
      mock.onGet(url).reply(200, activeIds);

      const result = await service.getActiveAccessTokenIdsFromIdentity();

      expect(result).toEqual(activeIds);
    });
  });

  describe('getEntity (inherited from AccessTokenService)', () => {
    it('should throw FailedToAuthenticateException when API returns 403 with api tokens disabled error', async () => {
      const url = `${config.urls.identityService}/resources/vendor-only/users/access-tokens/v1/${fakeEntity.sub}`;
      mock.onGet(url).reply(403, { errors: ['Api tokens are disabled'] });

      try {
        await service.getEntity(fakeEntity);
        fail('Expected FailedToAuthenticateException to be thrown');
      } catch (e) {
        expect(e).toBeInstanceOf(FailedToAuthenticateException);
      }
    });
  });

  describe('getActiveAccessTokenIds (inherited from AccessTokenService)', () => {
    it('should throw FailedToAuthenticateException when API returns 403 with api tokens disabled error', async () => {
      const url = `${config.urls.identityService}/resources/vendor-only/users/access-tokens/v1/active`;
      mock.onGet(url).reply(403, { errors: ['Api tokens are disabled'] });

      try {
        await service.getActiveAccessTokenIds();
        fail('Expected FailedToAuthenticateException to be thrown');
      } catch (e) {
        expect(e).toBeInstanceOf(FailedToAuthenticateException);
      }
    });
  });
});
