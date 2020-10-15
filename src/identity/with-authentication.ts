import { verify } from 'jsonwebtoken';
import { IdentityClient } from './identity-client';

export interface IWithAuthenticationOptions {
  roles?: string[];
  permissions?: string[];
}

export function withAuthentication({ roles = [], permissions = [] }: IWithAuthenticationOptions = {}) {
  return async (req, res, next) => {
    const authorizationHeader: string = req.header('authorization');
    if (!authorizationHeader) {
      return res.status(401).send('Unauthenticated');
    }

    const token = authorizationHeader.replace('Bearer ', '');
    const publicKey = await IdentityClient.getInstance().getPublicKey();

    verify(token, publicKey, { algorithms: ['RS256'] }, (err, user: any) => {
      if (err) {
        res.status(401).send('Authentication failed');
        return next(err);
      }

      for (const requestedRole of roles) {
        if (!user.roles || !user.roles.includes(requestedRole)) {
          res.status(403).send('Insufficient role');
          return next('Insufficient role');
        }
      }

      for (const requestedPermission of permissions) {
        if (!user.permissions || !user.permissions.includes(requestedPermission)) {
          res.status(403).send('Insufficient permission');
          return next('Insufficient permission');
        }
      }

      // Store the decoded user on the request
      req.user = user;
      req.user.id = user.sub; // The subject of the token (OpenID token) is saved on the req.user as well for easier readability
      // And move to the next handler
      next();
    });
  };
}
