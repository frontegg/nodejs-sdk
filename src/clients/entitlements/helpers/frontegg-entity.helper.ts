import { tokenTypes, TUserEntity } from '../../identity/types';
import type { CustomAttributes } from '@frontegg/entitlements-javascript-commons';

export function findUserId(entity: TUserEntity): string | undefined {
  switch (entity.type) {
    case tokenTypes.UserToken:
      return entity.sub;
    case tokenTypes.UserApiToken:
    case tokenTypes.UserAccessToken:
      return entity.userId;
  }
}

export function appendUserIdAttribute(customAttrs: CustomAttributes, entity: TUserEntity): CustomAttributes {
  const userId = findUserId(entity);

  return userId ? { ...customAttrs, 'frontegg.userId': userId } : customAttrs;
}
