import { IdentityClient } from './identity-client';

export interface IWithAuthenticationOptions {
  roles?: string[];
  permissions?: string[];
}

export enum tokenTypes {
  UserApiToken = 'userApiToken',
  TenantApiToken = 'tenantApiToken',
  UserToken = 'userToken',
}

export interface IUser {
  sub: string;
  tenantId: string;
  roles: string[];
  permissions: string[];
  metadata: Record<string, any>;
  createdByUserId: string;
  type: tokenTypes;
  name?: string;
  email?: string;
  email_verified?: boolean;
  invisible?: true;
  tenantIds?: string[];
  profilePictureUrl?: string;
}

export function withAuthentication({ roles = [], permissions = [] }: IWithAuthenticationOptions = {}) {
  return async (req, res, next) => {
    const authorizationHeader: string = req.header('authorization');
    if (!authorizationHeader) {
      return res.status(401).send('Unauthenticated');
    }

    const token = authorizationHeader.replace('Bearer ', '');

    let user: IUser;
    try {
      user = await IdentityClient.getInstance().validateIdentityOnToken(token, { roles, permissions });
    } catch (e) {
      const { statusCode, message } = e;
      res.status(statusCode).send(message);
      return next(e);
    }

    // Store the decoded user on the request
    req.user = user;
    req.user.id = '';

    switch (req.user.type) {
      case tokenTypes.UserToken:
        // The subject of the token (OpenID token) is saved on the req.user as well for easier readability
        req.user.id = user.sub;
        break;
      case tokenTypes.UserApiToken:
        req.user.id = user.createdByUserId;
        break;
    }

    // And move to the next handler
    next();
  };
}
