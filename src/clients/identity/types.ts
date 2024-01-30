import { IValidateStepupTokenOptions } from './step-up';

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
  withRolesAndPermissions?: boolean;
  stepUp?: boolean | IValidateStepupTokenOptions;
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

export type TUserEntity = IUser | IUserApiToken | IUserAccessToken | IUserAccessTokenWithRoles;

export type TTenantEntity = ITenantApiToken | ITenantAccessToken | ITenantAccessTokenWithRoles;

export type TEntity = TUserEntity | TTenantEntity;

export type IEntity = {
  id?: string;
  sub: string;
  tenantId: string;
  type: tokenTypes;
};

export type IEntityWithRoles = IEntity & {
  roles: Role[];
  permissions: Permission[];
};

export type IUser = IEntityWithRoles & {
  type: tokenTypes.UserToken;
  metadata: Record<string, any>;
  userId: string;
  name?: string;
  email?: string;
  email_verified?: boolean;
  invisible?: true;
  tenantIds?: string[];
  profilePictureUrl?: string;
  superUser?: true;
  amr?: string[];
  acr?: string;
  auth_time?: number;
};

export type IApiToken = IEntityWithRoles & {
  createdByUserId: string;
  type: tokenTypes.TenantApiToken | tokenTypes.UserApiToken;
  metadata: Record<string, unknown>;
};

export type ITenantApiToken = IApiToken & {
  type: tokenTypes.TenantApiToken;
};

export type IUserApiToken = IApiToken & {
  type: tokenTypes.UserApiToken;
  email: string;
  userMetadata: Record<string, unknown>;
  userId: string;
};

export type IAccessToken = IEntity & {
  type: tokenTypes.TenantAccessToken | tokenTypes.UserAccessToken;
};

export type ITenantAccessToken = IAccessToken & {
  type: tokenTypes.TenantAccessToken;
};

export type IUserAccessToken = IAccessToken & {
  type: tokenTypes.UserAccessToken;
  userId: string;
};

export interface IEmptyAccessToken {
  empty: true;
}

export interface ExtractCredentialsResult {
  publicKey: string;
  token: string;
}
