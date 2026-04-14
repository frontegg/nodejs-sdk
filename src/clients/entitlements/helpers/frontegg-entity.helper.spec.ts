import { findUserId, appendUserIdAttribute } from './frontegg-entity.helper';
import { tokenTypes } from '../../identity/types';
import type { IUser, IUserApiToken, IUserAccessToken } from '../../identity/types';
import type { CustomAttributes } from '@frontegg/entitlements-javascript-commons';

describe('findUserId', () => {
  it('returns sub for UserToken', () => {
    const entity = {
      type: tokenTypes.UserToken,
      sub: 'user-sub-123',
      tenantId: 't1',
      userId: 'user-id-456',
      roles: [],
      permissions: [],
      metadata: {},
    } as IUser;

    expect(findUserId(entity)).toBe('user-sub-123');
  });

  it('returns userId for UserApiToken', () => {
    const entity = {
      type: tokenTypes.UserApiToken,
      sub: 'sub-abc',
      tenantId: 't1',
      userId: 'api-user-789',
      roles: [],
      permissions: [],
      metadata: {},
      createdByUserId: 'creator',
      email: 'test@test.com',
      userMetadata: {},
    } as IUserApiToken;

    expect(findUserId(entity)).toBe('api-user-789');
  });

  it('returns userId for UserAccessToken', () => {
    const entity = {
      type: tokenTypes.UserAccessToken,
      sub: 'sub-xyz',
      tenantId: 't1',
      userId: 'access-user-321',
    } as IUserAccessToken;

    expect(findUserId(entity)).toBe('access-user-321');
  });
});

describe('appendUserIdAttribute', () => {
  it('adds frontegg.userId to custom attributes', () => {
    const attrs: CustomAttributes = { existing: 'value' };
    const entity = {
      type: tokenTypes.UserToken,
      sub: 'user-sub-123',
      tenantId: 't1',
      userId: 'user-id-456',
      roles: [],
      permissions: [],
      metadata: {},
    } as IUser;

    const result = appendUserIdAttribute(attrs, entity);

    expect(result).toEqual({ existing: 'value', 'frontegg.userId': 'user-sub-123' });
  });

  it('returns original attrs when userId not found', () => {
    const attrs: CustomAttributes = { existing: 'value' };
    const entity = {
      type: 'unknownType' as any,
      sub: 'sub',
      tenantId: 't1',
    } as any;

    const result = appendUserIdAttribute(attrs, entity);

    expect(result).toBe(attrs);
  });
});
