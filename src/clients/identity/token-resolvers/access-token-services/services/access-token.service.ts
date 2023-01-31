import { AxiosError } from "axios";
import { HttpClient } from "../../../../http";
import { FailedToAuthenticateException } from "../../../exceptions";
import { IAccessToken, IEntityWithRoles, tokenTypes } from "../../../types";
import { IAccessTokenService } from '../access-token.service.interface';

const apiTokensDisabledError = 'Api tokens are disabled';

export abstract class AccessTokenService<T extends IAccessToken> implements IAccessTokenService<T> {
    constructor(
        public readonly httpClient: HttpClient,
        public readonly type: tokenTypes.UserAccessToken | tokenTypes.TenantAccessToken
    ) { }

    public async getEntity(entity: T): Promise<IEntityWithRoles> {
        try {
            return await this.getEntityFromIdentity(entity)
        } catch (e) {
            if (e instanceof AxiosError) {
                if (this.isApiTokensDisabledError(e)) {
                    throw new FailedToAuthenticateException();
                }
            }

            throw e;
        }
    }

    public async getActiveAccessTokenIds(): Promise<string[]> {
        try {
            return await this.getActiveAccessTokenIdsFromIdentity()
        } catch (e) {
            if (e instanceof AxiosError) {
                if (this.isApiTokensDisabledError(e)) {
                    throw new FailedToAuthenticateException();
                }
            }

            throw e;
        }
    }

    public abstract getEntityFromIdentity(entity: T): Promise<IEntityWithRoles>;

    public abstract getActiveAccessTokenIdsFromIdentity(): Promise<string[]>;

    public shouldHandle(type: tokenTypes.UserAccessToken | tokenTypes.TenantAccessToken): boolean {
        return this.type === type;
    }

    private isApiTokensDisabledError(e: AxiosError<any, any>): boolean {
        return e?.response?.status === 403 && e?.response?.data?.errors?.[0] ===apiTokensDisabledError;
    }
}
