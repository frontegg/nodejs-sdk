import {
  IUser,
  IUserApiToken,
  ITenantApiToken,
  IUserAccessToken,
  ITenantAccessToken,
  IEntityWithRoles,
  tokenTypes,
} from '../clients/identity/types';

export const fakeUser: IUser = {
  sub: 'fake-sub',
  tenantId: 'fake-tenant-id',
  type: tokenTypes.UserToken,
  userId: 'fake-user-id',
  name: 'Fake User',
  metadata: { key: 'value' },
  email: 'fake@example.com',
  email_verified: true,
  invisible: true,
  tenantIds: ['fake-tenant-id'],
  profilePictureUrl: 'https://example.com/pic.jpg',
  roles: ['admin', 'user'],
  permissions: ['read', 'write'],
  amr: ['mfa', 'otp'],
  acr: 'http://schemas.openid.net/pape/policies/2007/06/multi-factor',
  auth_time: Math.floor(Date.now() / 1000),
  exp: Math.floor(Date.now() / 1000) + 3600,
  sid: 'fake-session-id',
  applicationId: 'fake-app-id',
};

export const fakeUserApiToken: IUserApiToken = {
  sub: 'fake-api-sub',
  tenantId: 'fake-tenant-id',
  type: tokenTypes.UserApiToken,
  createdByUserId: 'fake-creator-id',
  metadata: {},
  email: 'api-user@example.com',
  userMetadata: {},
  userId: 'fake-api-user-id',
  roles: ['admin'],
  permissions: ['read'],
  id: 'fake-user-api-token-id',
};

export const fakeTenantApiToken: ITenantApiToken = {
  sub: 'fake-tenant-api-sub',
  tenantId: 'fake-tenant-id',
  type: tokenTypes.TenantApiToken,
  createdByUserId: 'fake-creator-id',
  metadata: {},
  roles: ['admin'],
  permissions: ['read'],
  id: 'fake-tenant-api-token-id',
};

export const fakeUserAccessToken: IUserAccessToken = {
  sub: 'fake-user-access-sub',
  tenantId: 'fake-tenant-id',
  type: tokenTypes.UserAccessToken,
  userId: 'fake-access-user-id',
};

export const fakeTenantAccessToken: ITenantAccessToken = {
  sub: 'fake-tenant-access-sub',
  tenantId: 'fake-tenant-id',
  type: tokenTypes.TenantAccessToken,
};

export const fakeEntityWithRoles: IEntityWithRoles = {
  sub: 'fake-sub',
  tenantId: 'fake-tenant-id',
  type: tokenTypes.UserToken,
  roles: ['admin'],
  permissions: ['read'],
};

export const fakeVendorTokenResponse = {
  token: 'fake-vendor-token',
  expiresIn: 3600,
};

export const FAKE_BASE_URL = 'https://api.fake-frontegg.com';
export const FAKE_CLIENT_ID = 'test-client-id';
export const FAKE_API_KEY = 'test-api-key';
