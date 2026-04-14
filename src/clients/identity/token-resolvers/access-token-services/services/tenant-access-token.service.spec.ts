import axios from 'axios';
import MockAdapter from 'axios-mock-adapter';
import { TenantAccessTokenService } from './tenant-access-token.service';
import { HttpClient } from '../../../../http';
import { FronteggAuthenticator } from '../../../../../authenticator';
import { ITenantAccessToken, tokenTypes } from '../../../types';
import { FailedToAuthenticateException } from '../../../exceptions';
import { config } from '../../../../../config';

jest.mock('../../../../../authenticator');

describe('TenantAccessTokenService', () => {
  let service: TenantAccessTokenService;
  let mock: InstanceType<typeof MockAdapter>;
  const authenticator = new FronteggAuthenticator();
  const fakeToken = 'Bearer abc123';

  const fakeEntity: ITenantAccessToken = {
    sub: 'token-123',
    tenantId: 'tenant-456',
    type: tokenTypes.TenantAccessToken,
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
    service = new TenantAccessTokenService(httpClient);
  });

  afterEach(() => {
    mock.reset();
  });

  describe('shouldHandle', () => {
    it('should return true for TenantAccessToken type', () => {
      expect(service.shouldHandle(tokenTypes.TenantAccessToken)).toBe(true);
    });

    it('should return false for UserAccessToken type', () => {
      expect(service.shouldHandle(tokenTypes.UserAccessToken)).toBe(false);
    });
  });

  describe('getEntityFromIdentity', () => {
    it('should call the correct URL with entity.sub', async () => {
      const responseData = {
        id: 'token-123',
        tenantId: 'tenant-456',
        roles: ['admin'],
        permissions: ['read', 'write'],
      };

      const url = `${config.urls.identityService}/resources/vendor-only/tenants/access-tokens/v1/${fakeEntity.sub}`;
      mock.onGet(url).reply(200, responseData);

      const result = await service.getEntityFromIdentity(fakeEntity);

      expect(result).toEqual({
        ...fakeEntity,
        roles: ['admin'],
        permissions: ['read', 'write'],
      });
    });
  });

  describe('getActiveAccessTokenIdsFromIdentity', () => {
    it('should call the correct URL and return active ids', async () => {
      const activeIds = ['token-123', 'token-456'];
      const url = `${config.urls.identityService}/resources/vendor-only/tenants/access-tokens/v1/active`;
      mock.onGet(url).reply(200, activeIds);

      const result = await service.getActiveAccessTokenIdsFromIdentity();

      expect(result).toEqual(activeIds);
    });
  });

  describe('getEntity (inherited from AccessTokenService)', () => {
    it('should throw FailedToAuthenticateException when API returns 403 with api tokens disabled error', async () => {
      const url = `${config.urls.identityService}/resources/vendor-only/tenants/access-tokens/v1/${fakeEntity.sub}`;
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
      const url = `${config.urls.identityService}/resources/vendor-only/tenants/access-tokens/v1/active`;
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
