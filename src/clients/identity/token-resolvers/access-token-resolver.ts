import Logger from '../../../components/logger';
import {
  AuthHeaderType,
  IAccessToken,
  IEntityWithRoles,
  IValidateTokenOptions,
  TEntityWithRoles,
  tokenTypes,
} from '../types';
import { FailedToAuthenticateException } from '../exceptions';
import { TokenResolver } from './token-resolver';
import { IAccessTokenService } from './access-token-services/access-token.service.interface';
import { LocalCacheManager, IORedisCacheManager, RedisCacheManager } from '../../../cache';
import {
  CacheTenantAccessTokenService,
  CacheUserAccessTokenService,
  TenantAccessTokenService,
  UserAccessTokenService,
} from './access-token-services';
import { FronteggAuthenticator } from '../../../authenticator';
import { HttpClient } from '../../http';
import { FronteggContext } from '../../../components/frontegg-context';

export class AccessTokenResolver extends TokenResolver<IAccessToken> {
  private authenticator: FronteggAuthenticator = new FronteggAuthenticator();
  private httpClient: HttpClient = new HttpClient(this.authenticator);
  private accessTokenServices: IAccessTokenService<IAccessToken>[] = [];

  constructor() {
    super([tokenTypes.TenantAccessToken, tokenTypes.UserAccessToken], AuthHeaderType.AccessToken);
  }

  public async validateToken(
    token: string,
    publicKey: string,
    options?: IValidateTokenOptions,
  ): Promise<IAccessToken | TEntityWithRoles<IAccessToken>> {
    await this.init();
    const entity = await super.verifyToken(token, publicKey);
    let entityWithRoles: IEntityWithRoles | null = null;

    if (options?.permissions?.length || options?.roles?.length) {
      entityWithRoles = await this.getEntity(entity);
      await this.validateRolesAndPermissions(entityWithRoles, options);
    } else {
      const activeIds = await this.getActiveAccessTokenIds(entity);

      if (!activeIds.some((id) => id === entity.sub)) {
        throw new FailedToAuthenticateException();
      }
    }

    return { ...(entityWithRoles || {}), ...entity };
  }

  public async init(): Promise<void> {
    const { FRONTEGG_CLIENT_ID, FRONTEGG_API_KEY } = FronteggContext.getContext();
    await this.authenticator.init(
      FRONTEGG_CLIENT_ID || process.env.FRONTEGG_CLIENT_ID || '',
      FRONTEGG_API_KEY || process.env.FRONTEGG_API_KEY || '',
    );

    this.initAccessTokenServices();
  }

  protected getEntity(entity: IAccessToken): Promise<IEntityWithRoles> {
    const service = this.getAccessTokenService(entity.type);

    return service.getEntity(entity);
  }

  private async getActiveAccessTokenIds(entity: IAccessToken): Promise<string[]> {
    const service = this.getAccessTokenService(entity.type);

    return service.getActiveAccessTokenIds();
  }

  private getAccessTokenService(
    type: tokenTypes.TenantAccessToken | tokenTypes.UserAccessToken,
  ): IAccessTokenService<IAccessToken> {
    const service = this.accessTokenServices.find((accessTokenService) => accessTokenService.shouldHandle(type));

    if (!service) {
      Logger.info('Failed to find access token service');
      throw new FailedToAuthenticateException();
    }

    return service;
  }

  private initAccessTokenServices(): void {
    if (this.accessTokenServices.length) {
      return;
    }

    const accessTokensOptions = FronteggContext.getOptions().accessTokensOptions;

    if (accessTokensOptions?.cache?.type === 'ioredis') {
      this.accessTokenServices = [
        new CacheTenantAccessTokenService(
          new IORedisCacheManager<IEntityWithRoles>(accessTokensOptions.cache.options),
          new IORedisCacheManager<string[]>(accessTokensOptions.cache.options),
          new TenantAccessTokenService(this.httpClient),
        ),
        new CacheUserAccessTokenService(
          new IORedisCacheManager<IEntityWithRoles>(accessTokensOptions.cache.options),
          new IORedisCacheManager<string[]>(accessTokensOptions.cache.options),
          new UserAccessTokenService(this.httpClient),
        ),
      ];
    } else if (accessTokensOptions?.cache?.type === 'redis') {
      this.accessTokenServices = [
        new CacheTenantAccessTokenService(
          new RedisCacheManager<IEntityWithRoles>(accessTokensOptions.cache.options),
          new RedisCacheManager<string[]>(accessTokensOptions.cache.options),
          new TenantAccessTokenService(this.httpClient),
        ),
        new CacheUserAccessTokenService(
          new RedisCacheManager<IEntityWithRoles>(accessTokensOptions.cache.options),
          new RedisCacheManager<string[]>(accessTokensOptions.cache.options),
          new UserAccessTokenService(this.httpClient),
        ),
      ];
    } else {
      this.accessTokenServices = [
        new CacheTenantAccessTokenService(
          new LocalCacheManager<IEntityWithRoles>(),
          new LocalCacheManager<string[]>(),
          new TenantAccessTokenService(this.httpClient),
        ),
        new CacheUserAccessTokenService(
          new LocalCacheManager<IEntityWithRoles>(),
          new LocalCacheManager<string[]>(),
          new UserAccessTokenService(this.httpClient),
        ),
      ];
    }
  }
}
