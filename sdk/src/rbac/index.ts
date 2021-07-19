import Logger from '../helpers/logger';

export interface IRbacContext {
  roles?: string[];
  permissions?: string[];
}
declare type fronteggRbacContextResolver = (req: Request) => Promise<IRbacContext>;

export interface IRule {
  url: string;
  method: string;

  requiredRoles?: string[];
  requiredPermissions?: string[];
}

export interface IAccessControlPolicy {
  default: 'allow' | 'deny';
  rules: IRule[];
}

export interface IRoleBasedAccessControlOptions {
  contextResolver: fronteggRbacContextResolver;
  policy: IAccessControlPolicy;
}

async function throwIfRequired(res, next, options: IRoleBasedAccessControlOptions) {
  if (options.policy.default === 'allow') {
    Logger.info('Default in policy is set to allow - continue here');
    return next();
  }

  // Additional logic will go here in the future
  Logger.info('Going to send forbidden error');
  return res.status(403).send({});
}

function matchRuleUrl(rule: IRule, req: any): boolean {
  // If method is a match
  if (rule.method === '*' || rule.method === req.method) {
    // Find the URL regex
    const urlRegex = rule.url.replace('*', '\\w*');
    const urlToTest = req.path.endsWith('/') ? req.path : req.path + '/';
    const match = new RegExp(urlRegex).test(urlToTest);
    if (match) {
      Logger.info(`Found match in permissions for url ${req.path}. Moving on from middleware`);
      return true;
    }
  }

  return false;
}

function validateRequiredPermissions(requiredPermissions: string[], context: IRbacContext) {
  const currentPermissions = context.permissions;

  for (const requiredPermission of requiredPermissions) {
    if (!currentPermissions) {
      Logger.error(`permissions ${requiredPermission} is required but context has no permissions`);
      return false;
    }

    if (!currentPermissions.includes(requiredPermission)) {
      Logger.error(`permission ${requiredPermission} is not part of the context permissions`);
      return false;
    }
  }

  return true;
}

function validateRequiredRoles(requiredRoles: string[], context: IRbacContext) {
  const currentRoles = context.roles;

  for (const requiredRole of requiredRoles) {
    if (!currentRoles) {
      Logger.error(`role ${requiredRole} is required but context has no roles`);
      return false;
    }

    if (!currentRoles.includes(requiredRole)) {
      Logger.error(`role ${requiredRole} is not part of the context permissions`);
      return false;
    }
  }

  return true;
}

export function RbacMiddleware(options: IRoleBasedAccessControlOptions) {
  if (!options) { throw new Error('Missing options'); }
  if (!options.contextResolver) { throw new Error('Missing context resolver'); }
  if (!options.policy) { throw new Error('Missing configuration'); }

  return async (req, res, next) => {
    // First get the role
    const context = await options.contextResolver(req);
    // Make sure we have something valid
    if (!context.roles && !context.permissions) {
      Logger.error(`context doesn't have roles and permissions`);
      return throwIfRequired(res, next, options);
    }


    const { rules } = options.policy;
    for (const rule of rules) {
      if (!matchRuleUrl(rule, req)) {
        Logger.debug(`URL for rule ${rule.url} and method ${rule.method} is not a match to request path - ${req.path}`);
        continue;
      }

      // Get the required permissions
      if (rule.requiredPermissions && !validateRequiredPermissions(rule.requiredPermissions, context)) {
        Logger.info('Required permissions could not be matched');
        return res.status(403).send({});
      }

      // Get the required permissions
      if (rule.requiredRoles && !validateRequiredRoles(rule.requiredRoles, context)) {
        Logger.info('Required roles could not be matched');
        return res.status(403).send({});
      }

      Logger.info(`Allowed to pass on url - ${rule.url}`);
      return next();
    }


    // We have gone over all the rules in the policy - continue based on the default behavior
    return throwIfRequired(res, next, options);
  };
}
