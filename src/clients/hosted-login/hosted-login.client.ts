import { FronteggAuthenticator } from '../../authenticator';
import Logger from '../../components/logger';
import { FronteggContext } from '../../components/frontegg-context';
import axios, { AxiosError, AxiosResponse } from 'axios';
import { config } from '../../config';
import { decode } from 'jsonwebtoken';
import { CodeExchangeRequest, CodeExchangeResponse, RequestAuthorize } from './types';
import { IUser } from '../identity/types';

export class HostedLoginClient {
  private _baseURL: string | null = null;
  private _authenticator: FronteggAuthenticator | null = null;
  private _authorizationHeader: string | null = null;
  private readonly redirectURI: string;

  /**
   * @param redirectURI - Required, URI that the user will be redirected to once it was authenticated with Frontegg.
   */
  constructor(redirectURI: URL) {
    this.redirectURI = redirectURI.toString();
  }

  /**
   * Generates a URL to redirect the user in order to authenticate with Frontegg.
   * The user should be redirected to this URL
   * @param state - Optional, let you provide a state that will be provided on the response from Frontegg.
   * @returns authorization - the url to redirect the user to in order to authenticate with Frontegg
   */
  public async requestAuthorize({ state }: RequestAuthorize): Promise<string> {
    const baseURL = await this.getFronteggBaseURL();
    const { clientId } = this.getFronteggCredentials();
    const url = new URL(baseURL);
    url.pathname = '/oauth/authorize';
    url.searchParams.set('response_type', 'code');
    url.searchParams.set('client_id', clientId);
    url.searchParams.set('scope', 'openid+email+profile');
    url.searchParams.set('redirect_uri', this.redirectURI);
    if (state) {
      url.searchParams.set('state', state);
    }
    Logger.info('Authorize url was generated');
    return url.toString();
  }

  /**
   * This method verify the code provided by the client and exchange it with user information.
   * @param code - Required, on time code to verify the user authentication
   * @param state - Optional, required only if state was provided in the authorization request
   * @returns user - The user profile information.
   * @returns accessToken - User access token to call Frontegg APIs.
   * @returns refreshToken - refresh token to generate new access token.
   */
  public async codeExchange({ code, state }: CodeExchangeRequest): Promise<CodeExchangeResponse> {
    const authenticator = await this.getFronteggAuthenticator();
    Logger.info('Going to exchange token with Frontegg');
    try {
      const response: AxiosResponse<{ access_token: string; refresh_token: string }> = await axios.post(
        `${config.urls.oauthService}/token`,
        {
          grant_type: 'authorization_code',
          code,
          redirect_uri: this.redirectURI,
          state,
        },
        {
          headers: {
            'x-access-token': authenticator.accessToken,
            Authorization: this.getAuthorizationHeader(),
          },
        },
      );

      Logger.info('Token was exchanged with Frontegg, decoding access token');
      const user: IUser = this.decodeAccessToken(response.data.access_token);
      return {
        user,
        accessToken: response.data.access_token,
        refreshToken: response.data.refresh_token,
      };
    } catch (e) {
      Logger.error('failed to exchange token with Frontegg', e);
      if ((e as AxiosError).response) {
        throw new Error(
          `[${(e as AxiosError).response?.status}] ${(
            e as AxiosError<{ errors: string[] }>
          ).response?.data?.errors?.join(', ')}`,
        );
      }
      throw new Error('failed to exchange code');
    }
  }

  private decodeAccessToken(accessToken: string): IUser {
    return decode(accessToken, { json: true }) as IUser;
  }

  private getAuthorizationHeader(): string {
    if (!this._authorizationHeader) {
      const { clientId, apiKey } = this.getFronteggCredentials();
      const buffer = new Buffer(`${clientId}:${apiKey}`);
      this._authorizationHeader = `Basic ${buffer.toString('base64')}`;
    }
    return this._authorizationHeader;
  }

  private async getFronteggBaseURL(): Promise<string> {
    if (this._baseURL) {
      return this._baseURL;
    }
    return this.fetchBaseURL();
  }

  private getFronteggCredentials(): { clientId: string; apiKey: string } {
    const { FRONTEGG_CLIENT_ID, FRONTEGG_API_KEY } = FronteggContext.getContext();
    return {
      clientId: FRONTEGG_CLIENT_ID || process.env.FRONTEGG_CLIENT_ID || '',
      apiKey: FRONTEGG_API_KEY || process.env.FRONTEGG_API_KEY || '',
    };
  }

  private async fetchBaseURL() {
    const authenticator = await this.getFronteggAuthenticator();

    Logger.info('going to get vendor configuration');
    const response: AxiosResponse<{ baseURL: string }> = await axios.get(`${config.urls.vendorsService}/base-url`, {
      headers: {
        'x-access-token': authenticator.accessToken,
      },
    });

    Logger.info('got base url configuration');
    this._baseURL = response.data.baseURL;
    return this._baseURL;
  }

  private async getFronteggAuthenticator(): Promise<FronteggAuthenticator> {
    if (!this._authenticator) {
      const authenticator = new FronteggAuthenticator();
      const { apiKey, clientId } = this.getFronteggCredentials();
      Logger.info('going to authenticate with Frontegg');
      await authenticator.init(clientId, apiKey);
      this._authenticator = authenticator;
    }

    return this._authenticator;
  }
}
