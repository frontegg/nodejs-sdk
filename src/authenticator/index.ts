import axios, { AxiosResponse } from 'axios';
import { config } from '../config';
import Logger from '../components/logger';
import { retry } from '../utils';

export class FronteggAuthenticator {
  public accessToken: string = '';
  private accessTokenExpiry = Date.now();
  private clientId: string = '';
  private apiKey: string = '';
  private refreshTimeout: NodeJS.Timeout | null = null;
  private shuttingDown: boolean = false;

  public async init(clientId: string, apiKey: string) {
    this.clientId = clientId;
    this.apiKey = apiKey;
    let numberOfTries = 3;
    if (process.env.FRONTEGG_AUTHENTICATOR_NUMBER_OF_TRIES) {
      if (isNaN(+process.env.FRONTEGG_AUTHENTICATOR_NUMBER_OF_TRIES)) {
        Logger.error('got invalid value for FRONTEGG_AUTHENTICATOR_NUMBER_OF_TRIES');
      } else {
        numberOfTries = +process.env.FRONTEGG_AUTHENTICATOR_NUMBER_OF_TRIES;
      }
    }

    return retry(() => this.authenticate(), {
      numberOfTries,
      secondsDelayRange: {
        min: 0.5,
        max: 5,
      },
    });
  }

  public async refreshAuthentication() {
    await this.authenticate(true);
  }

  public async validateAuthentication() {
    if (this.accessToken === '' || this.accessTokenExpiry === 0 || Date.now() >= this.accessTokenExpiry) {
      Logger.info('authentication token needs refresh - going to refresh it');
      await this.refreshAuthentication();
    }
  }

  public async shutdown() {
    this.shuttingDown = true;
    if (this.refreshTimeout !== null) {
      clearTimeout(this.refreshTimeout);
    }
  }

  private async authenticate(force = false) {
    if (this.accessToken !== '' && !force) {
      return;
    }
    Logger.info('posting authentication request');

    let response: AxiosResponse<any>;
    try {
      response = await axios.post(config.urls.authenticationService, {
        clientId: this.clientId,
        secret: this.apiKey,
      });
    } catch (e) {
      Logger.error('Failed to authenticate with Frontegg');

      if (e.response) {
        Logger.error(`Failed with status - ${e.response.status}`);
      }

      this.accessToken = '';
      this.accessTokenExpiry = 0;
      throw new Error('Failed to authenticate with Frontegg');
    }

    Logger.info('authenticated with frontegg');

    // Get the token and the expiration time
    const { token, expiresIn } = response.data;
    // Save the token
    this.accessToken = token;
    // Next refresh is when we have only 20% of the sliding window remaining
    const nextRefresh = expiresIn * 1000 * 0.8;
    this.accessTokenExpiry = Date.now() + nextRefresh;

    if (!this.shuttingDown) {
      this.refreshTimeout = setTimeout(() => {
        this.refreshAuthentication();
      }, nextRefresh);
    }
  }
}
