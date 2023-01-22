import { config } from '../../../../../config';
import { IEntityWithRoles, IUserAccessToken, tokenTypes } from "../../../types";
import { IUserAccessTokenData } from "../types";
import { AccessTokenService } from './access-token.service';
import { HttpClient } from '../../../../http';

export class UserAccessTokenService extends AccessTokenService<IUserAccessToken> {
    constructor(public readonly httpClient: HttpClient) {
        super(httpClient, tokenTypes.UserAccessToken);
    }

    public async getEntityFromIdentity(entity: IUserAccessToken): Promise<IEntityWithRoles> {
        const { data } = await this.httpClient.get<IUserAccessTokenData>(
            `${config.urls.identityService}/resources/vendor-only/users/access-tokens/v1/${entity.sub}`
        );

        return {
            ...entity,
            roles: data.roles,
            permissions: data.permissions,
        };
    }

    public async getActiveAccessTokenIdsFromIdentity(): Promise<string[]> {
        const { data } = await this.httpClient.get<string[]>(
            `${config.urls.identityService}/resources/vendor-only/users/access-tokens/v1/active`
        );
        
        return data;
    }
}
