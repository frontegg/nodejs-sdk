import { AuditsClient } from './src/audits';
import { FronteggAuthenticator } from './src/authenticator';
import { IdentityClient } from './src/identity';
import { contextResolver, withAuthentication } from './src/identity';
import { ContextHolder, frontegg, fronteggNextJs, IFronteggOptions } from './src/middleware';
import { NotificationsClient } from './src/notifications';
import { FronteggPermissions } from './src/permissions';
import { RbacMiddleware } from './src/rbac';
import { SsoClient } from './src/sso';
import { TenantsClient } from './src/tenants';
import { AuthzClient, StrategyType } from "./src/authz";

export * from './src/events';

export {
  AuditsClient,
  ContextHolder,
  NotificationsClient,
  TenantsClient,
  frontegg,
  fronteggNextJs,
  FronteggPermissions,
  IFronteggOptions,
  FronteggAuthenticator,
  RbacMiddleware,
  SsoClient,
  withAuthentication,
  contextResolver,
  IdentityClient,
  AuthzClient,
  StrategyType
};
