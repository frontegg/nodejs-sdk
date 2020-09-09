import axios from 'axios';
import { FronteggAuthenticator } from '../authenticator';
import { config } from '../config';
import Logger from '../helpers/logger';
import {FRONTEGG_API_KEY, FRONTEGG_CLIENT_ID} from '../middleware';

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

  private async fetchPublicKey() {
    const authenticator = new FronteggAuthenticator();
    Logger.info('going to authenticate');
    await authenticator.init(FRONTEGG_CLIENT_ID || process.env.FRONTEGG_CLIENT_ID || '', FRONTEGG_API_KEY || process.env.FRONTEGG_API_KEY || '');
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
  }

}
