import { ICacheManager } from '../../../../../components/cache/managers/cache.manager.interface';
import { ITenantAccessToken, tokenTypes } from '../../../types';
import { AccessTokenService } from '../services/access-token.service';
import { CacheAccessTokenService } from './cache-access-token.service';

export class CacheTenantAccessTokenService extends CacheAccessTokenService<ITenantAccessToken> {
  constructor(
    public readonly cacheManager: ICacheManager,
    public readonly tenantAccessTokenService: AccessTokenService<ITenantAccessToken>,
  ) {
    super(cacheManager, tenantAccessTokenService, tokenTypes.TenantAccessToken);
  }

  protected getCachePrefix(): string {
    return 'frontegg_sdk_v1_user_access_tokens';
  }
}
