import axios from 'axios';
import { verify } from 'jsonwebtoken';
import { FronteggAuthenticator } from '../authenticator';
import { config } from '../config';
import Logger from '../helpers/logger';
import { ContextHolder } from '../middleware';
import { IUser, IWithAuthenticationOptions } from './with-authentication';

export class IdentityClient {
  public static getInstance() {
    if (!IdentityClient.instance) {
      IdentityClient.instance = new IdentityClient();
    }

    return IdentityClient.instance;
  }

  private static instance: IdentityClient;
  private publicKey: string;

  private constructor() {
    this.publicKey = '';
  }

  public async getPublicKey() {
    if (!this.publicKey) {
      Logger.info('going to retrieve public key');
      await this.fetchPublicKey();
      Logger.info('Retrieved public key');
    }

    return this.publicKey;
  }

  public async validateIdentityOnToken(token: string, options?: IWithAuthenticationOptions): Promise<IUser> {
    /* eslint-disable no-async-promise-executor */
    return new Promise<IUser>(async (resolve, reject) => {
      try {
        token = token.replace('Bearer ', '');
      } catch (e) {
        Logger.error('Failed to extract token - ', token);
        reject({ statusCode: 401, message: 'Failed to verify authentication' });
        return;
      }

      let publicKey: string;
      try {
        publicKey = await this.getPublicKey();
      } catch (e) {
        Logger.error('failed to get public key - ', e);
        reject({ statusCode: 401, message: 'Failed to verify authentication' });
        return;
      }

      verify(token, publicKey, { algorithms: ['RS256'] }, (err, decoded: any) => {
        const user: IUser = decoded;
        if (err) {
          Logger.error('Failed to verify jwt - ', err);
          reject({ statusCode: 401, message: 'Failed to verify authentication' });
          return;
        }

        if (options) {
          const { roles, permissions } = options;

          if (roles && roles.length > 0) {
            let haveAtLeastOneRole = false;
            for (const requestedRole of roles) {
              if (user.roles && user.roles.includes(requestedRole)) {
                haveAtLeastOneRole = true;
                break;
              }
            }

            if (!haveAtLeastOneRole) {
              Logger.info('Insufficient role');
              reject({ statusCode: 403, message: 'Insufficient role' });
              return;
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
              Logger.info('Insufficient permission');
              reject({ statusCode: 403, message: 'Insufficient permission' });
              return;
            }
          }
        }

        // Store the decoded user on the request
        resolve(user);
      });
    });
  }

  private async fetchPublicKey() {
    const authenticator = new FronteggAuthenticator();
    Logger.info('going to authenticate');
    const { FRONTEGG_CLIENT_ID, FRONTEGG_API_KEY } = ContextHolder.getContext();
    await authenticator.init(
      FRONTEGG_CLIENT_ID || process.env.FRONTEGG_CLIENT_ID || '',
      FRONTEGG_API_KEY || process.env.FRONTEGG_API_KEY || '',
    );
    Logger.info('going to get identity service configuration');
    const response = await axios.get(`${config.urls.identityService}/resources/configurations/v1`, {
      headers: {
        'x-access-token': authenticator.accessToken,
      },
    });

    Logger.info('got identity service configuration');
    // Get the public key
    const { publicKey } = response.data;
    // And save it as member of the class
    Logger.info('going to extract public key from response');
    this.publicKey = publicKey;
    await authenticator.shutdown();
  }
}
