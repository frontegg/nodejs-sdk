import { AuditsClient } from './src/audits';
import { IdentityClient } from './src/identity';
import { FronteggAuthenticator } from './src/authenticator';
import { contextResolver, withAuthentication } from './src/identity';
import { frontegg, fronteggNextJs, IFronteggOptions, ContextHolder } from './src/middleware';
import { NotificationsClient } from './src/notifications';
import { FronteggPermissions } from './src/permissions';
import { RbacMiddleware } from './src/rbac';
import { SsoClient } from './src/sso';
import { TenantsClient } from './src/tenants';

export * from './src/events';

export {
  AuditsClient,
  ContextHolder
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
  IdentityClient
};
