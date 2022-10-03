import { FronteggAuthenticator } from '../authenticator';
import Logger from '../helpers/logger';
import axios from 'axios';
import { config } from '../config';

export interface IAuthzStrategy {
  hasScopes(auth: string | FronteggAuthenticator, user: object, scope: string[], assetId?: string): Promise<boolean>;
}

export class OpaStrategy implements IAuthzStrategy {
  public async hasScopes(clientId: string, user: object, scope: string[], assetId?: string): Promise<boolean> {
    try {
      Logger.info('going to verify scope');

      clientId = clientId.replace(/-/g, '');

      const input: { [k: string]: any } = {};
      input['scope'] = scope[0]; // TODO: once decided if we use array or not for scopes, change it accordingly
      if (assetId) {
        input['assetId'] = assetId;
      }
      Object.keys(user).forEach((e) => {
        input[`${e}`] = user[`${e}`];
      });
      const opaPrefix = 'frontegg/opa';
      const { data } = await axios.post(
        `${config.urls.authzService}/v1/data/${opaPrefix}/${clientId}/allow`,
        { input },
        {
          headers: {
            'Content-Type': 'application/json',
          },
          responseType: 'json',
        },
      );
      Logger.info('verified scope successfully');
      return data.result;
    } catch (e) {
      Logger.error('failed to verify scope in authz service - ', e);
      throw e;
    }
  }
}

export class FronteggStrategy implements IAuthzStrategy {
  /* eslint-disable @typescript-eslint/no-unused-vars */
  public async hasScopes(
    clientId: FronteggAuthenticator,
    user: object,
    scope: Array<string>,
    assetId?: string,
  ): Promise<boolean> {
    return true;
  }
}
