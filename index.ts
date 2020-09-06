import { AuditsClient } from './src/audits';
import { FronteggAuthenticator } from './src/authenticator';
import { frontegg, IFronteggOptions } from './src/middleware';
import { NotificationsClient } from './src/notifications';
import { FronteggPermissions } from './src/permissions';
import { RbacMiddleware } from './src/rbac';
import { SsoClient } from './src/sso';
import { TenantsClient } from './src/tenants';
export * from './src/events';

export {
  AuditsClient,
  NotificationsClient,
  TenantsClient,
  frontegg,
  FronteggPermissions,
  IFronteggOptions,
  FronteggAuthenticator,
  RbacMiddleware,
  SsoClient,
};
