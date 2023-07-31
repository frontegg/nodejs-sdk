import { ICacheManager } from '../../../../../components/cache/managers/cache.manager.interface';
import { ITenantAccessToken, tokenTypes } from '../../../types';
import { AccessTokenService } from '../services/access-token.service';
import { CacheAccessTokenServiceAbstract } from './cache-access-token.service-abstract';

export class CacheTenantAccessTokenService extends CacheAccessTokenServiceAbstract<ITenantAccessToken> {
  constructor(cacheManager: ICacheManager<any>, tenantAccessTokenService: AccessTokenService<ITenantAccessToken>) {
    super(cacheManager, tenantAccessTokenService, tokenTypes.TenantAccessToken);
  }

  protected getCachePrefix(): string {
    return 'frontegg_sdk_v1_user_access_tokens_';
  }
}
