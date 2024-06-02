import MockAdapter from 'axios-mock-adapter';
import axios from 'axios';
import { config } from '../../config';
import { IdentityClient } from './identity-client';
import {
  AuthHeaderType,
  ITenantAccessToken,
  ITenantApiToken,
  IUser,
  IUserAccessToken,
  TEntityWithRoles,
  tokenTypes,
} from './types';
import { accessTokenHeaderResolver, authorizationHeaderResolver } from './token-resolvers';
import { AMR_METHOD_VALUE, AMR_MFA_VALUE, STEP_UP_ACR_VALUE } from './step-up';

jest.setTimeout(60000);

const fakeUser: IUser = {
  sub: 'fake-sub',
  tenantId: 'fake-tenant-id',
  type: tokenTypes.UserToken,
  userId: 'fake-user-id',
  name: 'fake-name',
  metadata: {},
  email: 'fake-email',
  invisible: true,
  tenantIds: ['fake-tenant-id'],
  profilePictureUrl: 'fake-pic-url',
  roles: ['role-key'],
  permissions: ['permission-key'],
};

const fakeTenantApiToken: ITenantApiToken = {
  createdByUserId: 'fake-created-by-user-id',
  sub: 'fake-sub',
  tenantId: 'fake-tenant-id',
  type: tokenTypes.TenantApiToken,
  metadata: {},
  permissions: ['permission-key'],
  roles: ['role-key'],
};

const fakeUserAccessToken: IUserAccessToken = {
  sub: 'fake-sub',
  tenantId: 'fake-tenant-id',
  type: tokenTypes.UserAccessToken,
  userId: 'fake-user-id',
};

const fakeTenantAccessToken: ITenantAccessToken = {
  sub: 'fake-sub',
  tenantId: 'fake-tenant-id',
  type: tokenTypes.TenantAccessToken,
};

const fakeUserAccessTokenWithRoles: TEntityWithRoles<IUserAccessToken> = {
  ...fakeUserAccessToken,
  roles: ['ReadOnly'],
  permissions: ['ReadOnly'],
};

const fakeTenantAccessTokenWithRoles: TEntityWithRoles<ITenantAccessToken> = {
  ...fakeTenantAccessToken,
  roles: ['ReadOnly'],
  permissions: ['ReadOnly'],
};

const fakeVendorToken = 'fake-vendor-token';

jest.useFakeTimers();

describe('Identity client', () => {
  let axiosMock;

  beforeEach(() => {
    axiosMock = new MockAdapter(axios);
    axiosMock.onPost(config.urls.authenticationService).reply(200, { token: fakeVendorToken, expiresIn: 100000 });
    axiosMock
      .onGet(`${config.urls.identityService}/resources/configurations/v1`, {})
      .reply(200, { publicKey: 'fake-public-key' });
  });

  afterEach(() => {
    axiosMock.restore();
  });

  it('should throw error if could not find resolver', async () => {
    try {
      //@ts-ignore
      await IdentityClient.getInstance().validateToken('fake-token', {}, 'invalid-header-type');
      fail('should throw');
    } catch (e: any) {
      expect(e.statusCode).toEqual(401);
      expect(e.message).toEqual('Failed to verify authentication');
    }
  });

  it('should validate entity', async () => {
    //@ts-ignore
    jest.spyOn(authorizationHeaderResolver, 'verifyAsync').mockImplementation(() => fakeUser);
    const res = await IdentityClient.getInstance().validateToken('fake-token', {}, AuthHeaderType.JWT);
    expect(res).toEqual(fakeUser);
  });

  it('should throw if stepup is required and token has no amr value', async () => {
    jest
      //@ts-ignore
      .spyOn(authorizationHeaderResolver, 'verifyAsync')
      //@ts-ignore
      .mockImplementation(() => ({ ...fakeUser, acr: STEP_UP_ACR_VALUE, amr: [] }));
    try {
      await IdentityClient.getInstance().validateToken('fake-token', { stepUp: true }, AuthHeaderType.JWT);
      fail('should throw');
    } catch (e: any) {
      expect(e.statusCode).toEqual(401);
      expect(e.message).toEqual('AMR is missing');
    }
  });

  it('should throw if stepup is required and token has wrong acr value', async () => {
    jest
      //@ts-ignore
      .spyOn(authorizationHeaderResolver, 'verifyAsync')
      //@ts-ignore
      .mockImplementation(() => ({ ...fakeUser, acr: 'not-stepup-acr' }));
    try {
      await IdentityClient.getInstance().validateToken('fake-token', { stepUp: {} }, AuthHeaderType.JWT);
      fail('should throw');
    } catch (e: any) {
      expect(e.statusCode).toEqual(401);
      expect(e.message).toEqual('Missing ACR: http://schemas.openid.net/pape/policies/2007/06/multi-factor');
    }
  });

  it('should throw if stepup is required and maxAge exceeded', async () => {
    //@ts-ignore
    jest.spyOn(authorizationHeaderResolver, 'verifyAsync').mockImplementation(() => ({
      ...fakeUser,
      acr: STEP_UP_ACR_VALUE,
      amr: [AMR_MFA_VALUE, AMR_METHOD_VALUE[0]],
      auth_time: Date.now() / 1000 - 20,
    }));
    try {
      await IdentityClient.getInstance().validateToken('fake-token', { stepUp: { maxAge: 5 } }, AuthHeaderType.JWT);
      fail('should throw');
    } catch (e: any) {
      expect(e.statusCode).toEqual(401);
      expect(e.message).toEqual('Max age exceeded');
    }
  });

  it('should not throw if stepup is required and maxAge is not exceeded', async () => {
    const fakeSteppedUpUser = {
      ...fakeUser,
      acr: STEP_UP_ACR_VALUE,
      amr: [AMR_MFA_VALUE, AMR_METHOD_VALUE[0]],
      auth_time: Date.now() / 1000 - 20,
    };
    //@ts-ignore
    jest.spyOn(authorizationHeaderResolver, 'verifyAsync').mockImplementation(() => fakeSteppedUpUser);
    const res = await IdentityClient.getInstance().validateToken(
      'fake-token',
      { stepUp: { maxAge: 1000 } },
      AuthHeaderType.JWT,
    );
    expect(res).toEqual(fakeSteppedUpUser);
  });

  it.each([{ claims: fakeUserAccessToken }, { claims: fakeTenantAccessToken }])(
    'should validate access token entity without fetching roles',
    async ({ claims }) => {
      //@ts-ignore
      jest.spyOn(accessTokenHeaderResolver, 'verifyAsync').mockImplementation(() => claims);
      //@ts-ignore
      jest.spyOn(accessTokenHeaderResolver, 'getActiveAccessTokenIds').mockImplementation(() => [claims.sub]);

      const res = await IdentityClient.getInstance().validateToken('fake-token', {}, AuthHeaderType.AccessToken);
      expect(res).toEqual(claims);
    },
  );

  it.each([{ claims: fakeUserAccessToken }, { claims: fakeTenantAccessToken }])(
      'should validate access token entity without fetching roles',
      async ({ claims }) => {
        //@ts-ignore
        jest.spyOn(accessTokenHeaderResolver, 'verifyAsync').mockImplementation(() => claims);
        //@ts-ignore
        jest.spyOn(accessTokenHeaderResolver, 'getActiveAccessTokenIds').mockImplementation(() => [claims.sub]);
        //@ts-ignore
        jest.spyOn(authorizationHeaderResolver, 'verifyAsync').mockImplementation(() => claims);

        const res = await IdentityClient.getInstance().validateIdentityOnToken('fake-token', {});
        expect(res).toEqual(claims);
      },
  );

  it.each([
    { claims: fakeUserAccessToken, entity: fakeUserAccessTokenWithRoles },
    { claims: fakeTenantAccessTokenWithRoles, entity: fakeTenantAccessTokenWithRoles },
  ])('should validate access token with roles', async ({ claims, entity }) => {
    //@ts-ignore
    jest.spyOn(accessTokenHeaderResolver, 'verifyAsync').mockImplementation(() => claims);
    //@ts-ignore
    jest.spyOn(accessTokenHeaderResolver, 'getEntity').mockImplementation(() => entity);

    const res = await IdentityClient.getInstance().validateToken(
      'fake-token',
      { roles: ['ReadOnly'] },
      AuthHeaderType.AccessToken,
    );
    expect(res).toEqual(entity);
  });

  it.each([
    { resolver: accessTokenHeaderResolver, type: AuthHeaderType.AccessToken, claims: fakeUser },
    { resolver: authorizationHeaderResolver, type: AuthHeaderType.JWT, claims: fakeUserAccessToken },
  ])('should throw if provided token in the wrong header', async ({ resolver, type, claims }) => {
    //@ts-ignore
    jest.spyOn(resolver, 'verifyAsync').mockImplementation(() => claims);
    try {
      await IdentityClient.getInstance().validateToken('fake-token', {}, type);
    } catch (e: any) {
      expect(e.statusCode).toEqual(400);
      expect(e.message).toEqual('Invalid token type');
    }
  });

  it('should throw if entity doesnt have the required roles', async () => {
    //@ts-ignore
    jest.spyOn(authorizationHeaderResolver, 'verifyAsync').mockImplementation(() => fakeUser);
    try {
      await IdentityClient.getInstance().validateToken('fake-token', { roles: ['ReadOnly'] }, AuthHeaderType.JWT);
    } catch (e: any) {
      expect(e.statusCode).toEqual(403);
      expect(e.message).toEqual('Insufficient role');
    }
  });
});
