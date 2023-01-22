import { IAccessToken, IEntityWithRoles, tokenTypes } from "../../types";

export interface IAccessTokenService<T extends IAccessToken> {
    getEntity(entity: T): Promise<IEntityWithRoles>;
    getActiveAccessTokenIds(): Promise<string[]>;
    shouldHandle(type: tokenTypes.UserAccessToken | tokenTypes.TenantAccessToken): boolean;
}