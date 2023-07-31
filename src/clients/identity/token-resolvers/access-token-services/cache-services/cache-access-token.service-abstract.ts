import { IAccessToken, IEmptyAccessToken, IEntityWithRoles, tokenTypes } from '../../../types';
import { IAccessTokenService } from '../access-token.service.interface';
import { ICacheManager } from '../../../../../components/cache/managers/cache.manager.interface';
import { FailedToAuthenticateException } from '../../../exceptions';

export abstract class CacheAccessTokenServiceAbstract<T extends IAccessToken> implements IAccessTokenService<T> {
  protected abstract getCachePrefix(): string;

  public readonly entityCacheManager: ICacheManager<IEntityWithRoles | IEmptyAccessToken>;
  public readonly activeAccessTokensCacheManager: ICacheManager<string[]>;

  protected constructor(
    cacheManager: ICacheManager<any>,
    public readonly accessTokenService: IAccessTokenService<T>,
    public readonly type: tokenTypes.UserAccessToken | tokenTypes.TenantAccessToken,
  ) {
    this.entityCacheManager = cacheManager.forScope(this.getCachePrefix());
    this.activeAccessTokensCacheManager = cacheManager.forScope(this.getCachePrefix());
  }

  public async getEntity(entity: T): Promise<IEntityWithRoles> {
    const cacheKey = entity.sub;
    const cachedData = await this.entityCacheManager.get(cacheKey);

    if (cachedData) {
      if (this.isEmptyAccessToken(cachedData)) {
        throw new FailedToAuthenticateException();
      } else {
        return cachedData;
      }
    }

    try {
      const data = await this.accessTokenService.getEntity(entity);
      await this.entityCacheManager.set(cacheKey, data, { expiresInSeconds: 10 });

      return data;
    } catch (e) {
      if (e instanceof FailedToAuthenticateException) {
        await this.entityCacheManager.set(cacheKey, { empty: true }, { expiresInSeconds: 10 });
      }

      throw e;
    }
  }

  public async getActiveAccessTokenIds(): Promise<string[]> {
    const cacheKey = `ids`;
    const cachedData = await this.activeAccessTokensCacheManager.get(cacheKey);

    if (cachedData) {
      return cachedData;
    }

    try {
      const data = await this.accessTokenService.getActiveAccessTokenIds();
      this.activeAccessTokensCacheManager.set(cacheKey, data, { expiresInSeconds: 10 });

      return data;
    } catch (e) {
      if (e instanceof FailedToAuthenticateException) {
        await this.activeAccessTokensCacheManager.set(cacheKey, [], { expiresInSeconds: 10 });
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
}
