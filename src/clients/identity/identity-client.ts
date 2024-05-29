import axios from 'axios';
import { FronteggAuthenticator } from '../../authenticator';
import { config } from '../../config';
import Logger from '../../components/logger';
import { FronteggContext } from '../../components/frontegg-context';
import {
  AuthHeaderType,
  ExtractCredentialsResult, IAccessToken,
  IEntityWithRoles,
  IUser,
  IValidateTokenOptions,
  TEntity,
} from './types';
import { accessTokenHeaderResolver, authorizationHeaderResolver, TokenResolver } from './token-resolvers';
import { FailedToAuthenticateException } from './exceptions';
import { IFronteggContext } from '../../components/frontegg-context/types';

const tokenResolvers = [authorizationHeaderResolver, accessTokenHeaderResolver];

export class IdentityClient {
  public static getInstance() {
    if (!IdentityClient.instance) {
      IdentityClient.instance = new IdentityClient(FronteggContext.getContext());
    }

    return IdentityClient.instance;
  }

  private static instance: IdentityClient;
  private publicKey: string;
  private readonly context: IFronteggContext;

  public constructor(context: IFronteggContext) {
    this.publicKey = '';
    this.context = context;
  }

  public async getPublicKey() {
    if (!this.publicKey) {
      Logger.info('going to retrieve public key');
      await this.fetchPublicKey();
      Logger.info('Retrieved public key');
    }

    return this.publicKey;
  }

  public async validateToken(
    token: string,
    options?: IValidateTokenOptions,
    type: AuthHeaderType = AuthHeaderType.JWT,
  ): Promise<TEntity> {
    const { token: formattedToken, publicKey } = await this.extractTokenCredentials(token, type);

    const resolver = tokenResolvers.find((resolver) => resolver.shouldHandle(type)) as TokenResolver<TEntity>;
    if (!resolver) {
      Logger.error('Failed to find token resolver');
      throw new FailedToAuthenticateException();
    }

    return await resolver.validateToken(formattedToken, publicKey, options);
  }

  public async validateIdentityOnToken(token: string, options?: IValidateTokenOptions)
      : Promise<IEntityWithRoles | IAccessToken> {
    const { token: formattedToken, publicKey } = await this.extractTokenCredentials(token, AuthHeaderType.JWT);

    for(let i = 0; i < tokenResolvers.length; i++){
      try{
        const res =  await tokenResolvers[i].validateToken(formattedToken, publicKey, options);
        return res
      }catch(e){
        if(i === tokenResolvers.length - 1){
          throw e;
        }
      }
    }
    throw new FailedToAuthenticateException();
  }

  private async extractTokenCredentials(token: string, type: AuthHeaderType): Promise<ExtractCredentialsResult> {
    if (type === AuthHeaderType.JWT) {
      try {
        token = token.replace('Bearer ', '');
      } catch (e) {
        Logger.error('Failed to extract token - ', token);
        throw new FailedToAuthenticateException();
      }
    }

    let publicKey: string;
    try {
      publicKey = await this.getPublicKey();
    } catch (e) {
      Logger.error('failed to get public key - ', e);
      throw new FailedToAuthenticateException();
    }

    return { publicKey, token };
  }

  private async fetchPublicKey() {
    const authenticator = new FronteggAuthenticator();
    Logger.info('going to authenticate');
    const { FRONTEGG_CLIENT_ID, FRONTEGG_API_KEY } = this.context;
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
