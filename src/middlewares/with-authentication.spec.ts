import MockAdapter from 'axios-mock-adapter';
import { Request, Response } from 'express';
import { withAuthentication } from './with-authentication';
import axios from 'axios';
import { config } from '../config';
import { IdentityClient } from '../clients';
import { IUser, IUserAccessToken, tokenTypes } from '../clients/identity/types';

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

const fakeAccessToken: IUserAccessToken = {
  sub: 'fake-sub',
  tenantId: 'fake-tenant-id',
  type: tokenTypes.UserAccessToken,
  userId: 'fake-user-id',
};

jest.useFakeTimers();

describe('withAuthentication middleware', () => {
  let axiosMock;
  let mockRequest: Partial<Request>;
  let mockResponse: Partial<Response>;
  let nextFunction = jest.fn();

  beforeEach(() => {
    axiosMock = new MockAdapter(axios);
    axiosMock.onPost(config.urls.authenticationService).reply(200, { token: 'fake-vendor-token', expiresIn: 100000 });

    mockResponse = {};
    mockRequest = {
      //@ts-ignore
      header: (name: string): string | undefined => mockRequest.headers?.[name],
    };

    mockResponse.send = jest.fn();
    //@ts-ignore
    mockResponse.status = jest.fn((code: number) => mockResponse);
  });

  afterEach(() => {
    axiosMock.restore();
    nextFunction.mockClear();
  });

  it('should fail without auth headers', async () => {
    await withAuthentication({})(mockRequest as Request, mockResponse as Response, nextFunction);

    expect(mockResponse.status).toBeCalledWith(401);
    expect(mockResponse.send).toBeCalledWith('Unauthenticated');
  });

  it('should fail on invalid authorization header', async () => {
    mockRequest = { ...mockRequest, headers: { authorization: 'bearer invalid-token' } };

    await withAuthentication({})(mockRequest as Request, mockResponse as Response, nextFunction);

    expect(mockResponse.status).toBeCalledWith(401);
    expect(mockResponse.send).toBeCalledWith('Failed to verify authentication');
  });

  it('should fail on invalid access token header', async () => {
    mockRequest = { ...mockRequest, headers: { 'x-api-key': 'bearer invalid-token' } };

    await withAuthentication({})(mockRequest as Request, mockResponse as Response, nextFunction);

    expect(mockResponse.status).toBeCalledWith(401);
    expect(mockResponse.send).toBeCalledWith('Failed to verify authentication');
  });

  it('should set user on request after validation', async () => {
    mockRequest = { ...mockRequest, headers: { authorization: 'bearer valid-token' } };
    //@ts-ignore
    jest.spyOn(IdentityClient, 'getInstance').mockImplementation(() => ({
      validateToken: (): Promise<IUser> => Promise.resolve(fakeUser),
    }));

    await withAuthentication({})(mockRequest as Request, mockResponse as Response, nextFunction);

    expect(nextFunction).toBeCalledTimes(1);
    //@ts-ignore
    expect(mockRequest.frontegg.user).toEqual({
      ...fakeUser,
      id: fakeUser.sub,
    });
  });

  it('should set user access token on request after validation', async () => {
    mockRequest = { ...mockRequest, headers: { 'x-api-key': 'valid-token' } };
    //@ts-ignore
    jest.spyOn(IdentityClient, 'getInstance').mockImplementation(() => ({
      validateToken: (): Promise<IUserAccessToken> => Promise.resolve(fakeAccessToken),
    }));

    await withAuthentication({})(mockRequest as Request, mockResponse as Response, nextFunction);

    expect(nextFunction).toBeCalledTimes(1);
    //@ts-ignore
    expect(mockRequest.frontegg.user).toEqual({
      ...fakeAccessToken,
      id: fakeAccessToken.userId,
    });
  });
});
