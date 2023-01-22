export interface IAccessTokenData {
    id: string;
    tenantId: string;
    permissions: string[];
    roles: string[];
    expires?: Date;
}

// eslint-disable-next-line @typescript-eslint/no-empty-interface
export interface ITenantAccessTokenData extends IAccessTokenData { }

export interface IUserAccessTokenData extends IAccessTokenData {
    userId: string;
}