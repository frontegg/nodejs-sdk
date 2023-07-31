import { ICacheManager } from '../../../../../components/cache/managers/cache.manager.interface';
import { IUserAccessToken, tokenTypes } from '../../../types';
import { AccessTokenService } from '../services/access-token.service';
import { CacheAccessTokenServiceAbstract } from './cache-access-token.service-abstract';

export class CacheUserAccessTokenService extends CacheAccessTokenServiceAbstract<IUserAccessToken> {
  constructor(
    cacheManager: ICacheManager<any>,
    public readonly userAccessTokenService: AccessTokenService<IUserAccessToken>,
  ) {
    super(cacheManager, userAccessTokenService, tokenTypes.UserAccessToken);
  }

  protected getCachePrefix(): string {
    return 'frontegg_sdk_v1_tenant_access_tokens_';
  }
}
