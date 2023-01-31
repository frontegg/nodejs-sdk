import { ICacheManager } from '../../../../../cache/cache.manager.interface';
import { IEmptyAccessToken, IEntityWithRoles, ITenantAccessToken, tokenTypes } from "../../../types";
import { AccessTokenService } from '../services/access-token.service';
import { CacheAccessTokenService } from './cache-access-token.service';

export class CacheTenantAccessTokenService extends CacheAccessTokenService<ITenantAccessToken> {
    constructor(
        public readonly entityCacheManager: ICacheManager<IEntityWithRoles | IEmptyAccessToken>,
        public readonly activeAccessTokensCacheManager: ICacheManager<string[]>,
        public readonly tenantAccessTokenService: AccessTokenService<ITenantAccessToken>
    ) {
        super(
            entityCacheManager,
            activeAccessTokensCacheManager,
            tenantAccessTokenService,
            tokenTypes.TenantAccessToken
        );
    }

    protected getCachePrefix(): string {
        return 'frontegg_sdk_v1_user_access_tokens'
    }
}
