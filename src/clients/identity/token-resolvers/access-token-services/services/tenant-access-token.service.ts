import { config } from '../../../../../config';
import { IEntityWithRoles, ITenantAccessToken, tokenTypes } from "../../../types";
import { ITenantAccessTokenData } from "../types";
import { AccessTokenService } from './access-token.service';
import { HttpClient } from '../../../../http';

export class TenantAccessTokenService extends AccessTokenService<ITenantAccessToken> {
    constructor(public readonly httpClient: HttpClient) {
        super(httpClient, tokenTypes.TenantAccessToken);
    }

    public async getEntityFromIdentity(entity: ITenantAccessToken): Promise<IEntityWithRoles> {
        const { data } = await this.httpClient.get<ITenantAccessTokenData>(
            `${config.urls.identityService}/resources/vendor-only/tenants/access-tokens/v1/${entity.sub}`
        );

        return {
            ...entity,
            roles: data.roles,
            permissions: data.permissions,
        };
    }

    public async getActiveAccessTokenIdsFromIdentity(): Promise<string[]> {
        const { data } = await this.httpClient.get<string[]>(
            `${config.urls.identityService}/resources/vendor-only/tenants/access-tokens/v1/active`
        );
        
        return data;
    }
}
