import { verify } from 'jsonwebtoken';
import { IdentityClient } from './identity-client';

export interface IWithAuthenticationOptions {
  roles?: string[];
  permissions?: string[];
}

export interface IUser {
  sub: string
  tenantId: string
  roles: string[]
  permissions: string[]
  metadata: Record<string, any>
  createdByUserId: string
  type: 'userApiToken' | 'tenantApiToken' | 'userToken'
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
    const publicKey = await IdentityClient.getInstance().getPublicKey();

    verify(token, publicKey, { algorithms: ['RS256'] }, (err, decoded: any) => {
      const user: IUser = decoded
      if (err) {
        res.status(401).send('Authentication failed');
        return next(err);
      }

      if (roles && roles.length > 0) {
        let haveAtLeastOneRole = false;
        for (const requestedRole of roles) {
          if (user.roles && user.roles.includes(requestedRole)) {
            haveAtLeastOneRole = true;
            break;
          }
        }

        if (!haveAtLeastOneRole) {
          res.status(403).send('Insufficient role');
          return next('Insufficient role');
        }
      }

      if (permissions && permissions.length > 0) {
        let haveAtLeastOnePermission = false;
        for (const requestedPermission of permissions) {
          if (user.permissions && user.permissions.includes(requestedPermission)) {
            haveAtLeastOnePermission = true;
            break;
          }
        }

        if (!haveAtLeastOnePermission) {
          res.status(403).send('Insufficient permission');
          return next('Insufficient permission');
        }
      }

      // Store the decoded user on the request
      req.user = user;
      req.user.id = ''

      switch (req.user.type) {
        case 'userToken':
          req.user.id = user.sub; // The subject of the token (OpenID token) is saved on the req.user as well for easier readability
          break;
        case 'userApiToken':
          req.user.id = user.createdByUserId
          break;
      }

      // And move to the next handler
      next();
    });
  };
}
