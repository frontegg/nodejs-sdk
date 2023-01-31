import { AccessTokenResolver } from './access-token-resolver';
import { AuthorizationJWTResolver } from './authorization-token-resolver';

export * from './authorization-token-resolver';
export * from './access-token-services';
export * from './access-token-resolver';
export * from './token-resolver';

export const authorizationHeaderResolver = new AuthorizationJWTResolver(); 
export const accessTokenHeaderResolver = new AccessTokenResolver(); 