import {Request, Response} from 'express';
import {IdentityClient} from '../clients';
import {StatusCodeError} from '../clients/identity/exceptions/status-code-error.exception';
import {IUser, TEntity, tokenTypes} from '../clients/identity/types';
import Logger from '../components/logger';
import {getAuthHeader} from "../utils";

export interface IWithAuthenticationOptions {
  roles?: string[];
  permissions?: string[];
}

export function withAuthentication({ roles = [], permissions = [] }: IWithAuthenticationOptions = {}) {
  return async (req: Request, res: Response, next) => {
    const authHeader = getAuthHeader(req);

    if (!authHeader) {
      return res.status(401).send('Unauthenticated');
    }

    const { token, type } = authHeader;
    let user: TEntity;

    try {
      user = await IdentityClient.getInstance().validateToken(token, { roles, permissions }, type);
    } catch (e) {
      const { statusCode, message } = <StatusCodeError>e;
      Logger.error(message);
      res.status(statusCode).send(message ? message : `Failed to verify authentication`);
      return next(e);
    }

    // Store the decoded user on the request
    req.frontegg = {
      user: { ...user, id: '' } as IUser,
    };

    switch (user.type) {
      case tokenTypes.UserToken:
        // The subject of the token (OpenID token) is saved on the req.frontegg.user as well for easier readability
        req.frontegg.user.id = user.sub;
        break;
      case tokenTypes.UserApiToken:
        req.frontegg.user.id = user.createdByUserId;
        break;
      case tokenTypes.UserAccessToken:
        req.frontegg.user.id = user.userId;
    }

    // And move to the next handler
    next();
  };
}

