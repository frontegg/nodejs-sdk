import { ICacheManager } from '../../../../../cache/cache.manager.interface';
import { IEmptyAccessToken, IEntityWithRoles, IUserAccessToken, tokenTypes } from "../../../types";
import { AccessTokenService } from '../services/access-token.service';
import { CacheAccessTokenService } from './cache-access-token.service';

export class CacheUserAccessTokenService extends CacheAccessTokenService<IUserAccessToken> {
    constructor(
        public readonly entityCacheManager: ICacheManager<IEntityWithRoles | IEmptyAccessToken>,
        public readonly activeAccessTokensCacheManager: ICacheManager<string[]>,
        public readonly userAccessTokenService: AccessTokenService<IUserAccessToken>,
    ) {
        super(entityCacheManager, activeAccessTokensCacheManager, userAccessTokenService, tokenTypes.UserAccessToken);
    }

    protected getCachePrefix(): string {
        return 'frontegg_sdk_v1_tenant_access_tokens'
    }
}
