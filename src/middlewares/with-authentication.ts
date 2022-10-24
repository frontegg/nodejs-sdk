import { IdentityClient } from '../clients';
import Logger from '../components/logger';
import { Request, Response } from 'express';

export interface IWithAuthenticationOptions {
  roles?: string[];
  permissions?: string[];
}

export enum tokenTypes {
  UserApiToken = 'userApiToken',
  TenantApiToken = 'tenantApiToken',
  UserToken = 'userToken',
}

export type Role = string;
export type Permission = string;
export interface IUser {
  id?: string;
  sub: string;
  tenantId: string;
  roles: Role[];
  permissions: Permission[];
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
  return async (req: Request, res: Response, next) => {
    const authorizationHeader: string | undefined = req.header('authorization');
    if (!authorizationHeader) {
      return res.status(401).send('Unauthenticated');
    }

    const token = authorizationHeader.replace('Bearer ', '');

    let user: IUser;
    try {
      user = await IdentityClient.getInstance().validateIdentityOnToken(token, { roles, permissions });
    } catch (e) {
      const { statusCode, message } = e;
      Logger.error(message);
      res.status(statusCode).send(`Failed to verify authentication`);
      return next(e);
    }

    // Store the decoded user on the request
    req.frontegg = {
      user: { ...user, id: '' }
    };

    const userType = user.type;
    switch (req.frontegg.user.type) {
      case tokenTypes.UserToken:
        // The subject of the token (OpenID token) is saved on the req.frontegg.user as well for easier readability
        req.frontegg.user.id = user.sub;
        break;
      case tokenTypes.UserApiToken:
        req.frontegg.user.id = user.createdByUserId;
        break;
    }

    // And move to the next handler
    next();
  };
}
