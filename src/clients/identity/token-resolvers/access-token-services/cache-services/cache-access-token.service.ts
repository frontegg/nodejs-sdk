import { IAccessToken, IEmptyAccessToken, IEntityWithRoles, tokenTypes } from '../../../types';
import { IAccessTokenService } from '../access-token.service.interface';
import { ICacheManager } from '../../../../../components/cache/managers/cache.manager.interface';
import { FailedToAuthenticateException } from '../../../exceptions';

export abstract class CacheAccessTokenService<T extends IAccessToken> implements IAccessTokenService<T> {
  constructor(
    public readonly cacheManager: ICacheManager,
    public readonly accessTokenService: IAccessTokenService<T>,
    public readonly type: tokenTypes.UserAccessToken | tokenTypes.TenantAccessToken,
  ) {}

  public async getEntity(entity: T): Promise<IEntityWithRoles> {
    const cacheKey = `${this.getCachePrefix()}_${entity.sub}`;
    const cachedData = await this.cacheManager.get<IEntityWithRoles | IEmptyAccessToken>(cacheKey);

    if (cachedData) {
      if (this.isEmptyAccessToken(cachedData)) {
        throw new FailedToAuthenticateException();
      } else {
        return cachedData;
      }
    }

    try {
      const data = await this.accessTokenService.getEntity(entity);
      await this.cacheManager.set<IEntityWithRoles | IEmptyAccessToken>(cacheKey, data, { expiresInSeconds: 10 });

      return data;
    } catch (e) {
      if (e instanceof FailedToAuthenticateException) {
        await this.cacheManager.set<IEntityWithRoles | IEmptyAccessToken>(
          cacheKey,
          { empty: true },
          { expiresInSeconds: 10 },
        );
      }

      throw e;
    }
  }

  public async getActiveAccessTokenIds(): Promise<string[]> {
    const cacheKey = `${this.getCachePrefix()}_ids`;
    const cachedData = await this.cacheManager.get<string[]>(cacheKey);

    if (cachedData) {
      return cachedData;
    }

    try {
      const data = await this.accessTokenService.getActiveAccessTokenIds();
      this.cacheManager.set<string[]>(cacheKey, data, { expiresInSeconds: 10 });

      return data;
    } catch (e) {
      if (e instanceof FailedToAuthenticateException) {
        await this.cacheManager.set<string[]>(cacheKey, [], { expiresInSeconds: 10 });
      }

      throw e;
    }
  }

  public shouldHandle(type: tokenTypes.UserAccessToken | tokenTypes.TenantAccessToken): boolean {
    return this.type === type;
  }

  private isEmptyAccessToken(accessToken: IEntityWithRoles | IEmptyAccessToken): accessToken is IEmptyAccessToken {
    return 'empty' in accessToken && accessToken.empty;
  }

  protected abstract getCachePrefix(): string;
}
