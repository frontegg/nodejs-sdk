import axios, { AxiosResponse } from 'axios';
import { config } from '../config';
import Logger from '../helpers/logger';

export class FronteggAuthenticator {
  constructor(maxRetries?: number) {
    this.maxRetries = maxRetries || 10;
  }

  public accessToken: string = '';
  private accessTokenExpiry = Date.now();
  private clientId: string = '';
  private apiKey: string = '';
  private refreshTimeout: NodeJS.Timeout | null = null;
  private shuttingDown: boolean = false;
  private retriesCount: number = 0;
  private maxRetries: number;

  public async init(clientId: string, apiKey: string) {
    this.clientId = clientId;
    this.apiKey = apiKey;

    return this.authenticate();
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

  private async authenticate(force: boolean = false) {
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
      Logger.error('failed to authenticate with frontegg - ', e);

      if (e.response) {
        Logger.error('failed response - ');
        Logger.error(e.response.data);
        Logger.error(e.response.status);
        Logger.error(e.response.headers);
      }

      this.accessToken = '';
      this.accessTokenExpiry = 0;

      if (this.maxRetries > this.retriesCount) {
        Logger.info(`try [${this.retriesCount}] failed to authenticate with frontegg, trying again`);
        this.retriesCount += 1;
        this.refreshAuthentication();
      }

      throw new Error('Failed to authenticate with frontegg');
    }

    this.retriesCount = 0;
    Logger.info('authenticated with frontegg');

    // Get the token and the expiration time
    const { token, expiresIn } = response.data;
    // Save the token
    this.accessToken = token;
    // Next refresh is when we have only 20% of the sliding window remaining
    const nextRefresh = (expiresIn * 1000) * 0.8;
    this.accessTokenExpiry = Date.now() + nextRefresh;

    if (!this.shuttingDown) {
      this.refreshTimeout = setTimeout(() => {
        this.refreshAuthentication();
      }, nextRefresh);
    }
  }
}
