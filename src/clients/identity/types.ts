export enum AuthHeaderType {
  JWT = 'JWT',
  AccessToken = 'AccessToken',
}

export interface AuthHeader {
  token: string;
  type: AuthHeaderType;
}

export interface IValidateTokenOptions {
  roles?: string[];
  permissions?: string[];
}

export enum tokenTypes {
  UserApiToken = 'userApiToken',
  TenantApiToken = 'tenantApiToken',
  UserToken = 'userToken',
  TenantAccessToken = 'tenantAccessToken',
  UserAccessToken = 'userAccessToken',
}

export type Role = string;
export type Permission = string;
export type TEntityWithRoles<T extends IEntity> = T & IEntityWithRoles;
export type IUserAccessTokenWithRoles = TEntityWithRoles<IUserAccessToken>;
export type ITenantAccessTokenWithRoles = TEntityWithRoles<ITenantAccessToken>;

export type TEntity =
  | IUser
  | IUserApiToken
  | ITenantApiToken
  | IUserAccessToken
  | IUserAccessTokenWithRoles
  | ITenantAccessToken
  | ITenantAccessTokenWithRoles;

export interface IEntity {
  id?: string;
  sub: string;
  tenantId: string;
  type: tokenTypes;
}

export interface IEntityWithRoles extends IEntity {
  roles: Role[];
  permissions: Permission[];
}

export interface IUser extends IEntityWithRoles {
  type: tokenTypes.UserToken;
  metadata: Record<string, any>;
  userId: string;
  name?: string;
  email?: string;
  email_verified?: boolean;
  invisible?: true;
  tenantIds?: string[];
  profilePictureUrl?: string;
}

export interface IApiToken extends IEntityWithRoles {
  createdByUserId: string;
  type: tokenTypes.TenantApiToken | tokenTypes.UserApiToken;
  metadata: Record<string, unknown>;
}

export interface ITenantApiToken extends IApiToken {
  type: tokenTypes.TenantApiToken;
}

export interface IUserApiToken extends IApiToken {
  type: tokenTypes.UserApiToken;
  email: string;
  userMetadata: Record<string, unknown>;
  userId: string;
}

export interface IAccessToken extends IEntity {
  type: tokenTypes.TenantAccessToken | tokenTypes.UserAccessToken;
}

export interface ITenantAccessToken extends IAccessToken {
  type: tokenTypes.TenantAccessToken;
}

export interface IUserAccessToken extends IAccessToken {
  type: tokenTypes.UserAccessToken;
  userId: string;
}

export interface IEmptyAccessToken {
  empty: true;
}

export interface ExtractCredentialsResult {
  publicKey: string;
  token: string;
}
