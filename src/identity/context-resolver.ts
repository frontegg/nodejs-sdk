import { FronteggPermissions } from '../../index';

export const contextResolver = (req) => {
  if (!req.user) {
    return {
      tenantId: '',
      userId: '',
      permissions: [FronteggPermissions.All],
      authenticatedEntityId: '',
      authenticatedEntityType: '',
    };
  }

  return {
    tenantId: req.user.tenantId,
    userId: req.user.id,
    permissions: [FronteggPermissions.All],
    authenticatedEntityId: req.user.sub,
    authenticatedEntityType: req.user.type,
  };
};

export const contextResolverWithPermissions = (req) => {
  if (!req.user) {
    return {
      tenantId: '',
      userId: '',
      permissions: [FronteggPermissions.All],
      userPermissions: [],
      authenticatedEntityId: '',
      authenticatedEntityType: '',
    };
  }

  return {
    tenantId: req.user.tenantId,
    userId: req.user.id,
    permissions: [FronteggPermissions.All],
    userPermissions: req.user.permissions,
    authenticatedEntityId: req.user.sub,
    authenticatedEntityType: req.user.type,
  };
};
