import { FronteggPermissions } from '../../index';

export const contextResolver = (req) => {
  if (!req.user) {
    return {
      tenantId: '',
      userId: '',
      permissions: [FronteggPermissions.All],
    };
  }

  return {
    tenantId: req.user.tenantId,
    userId: req.user.id,
    permissions: [FronteggPermissions.All],
  };
};

export const contextResolverWithPermissions = (req) => {
  if (!req.user) {
    return {
      tenantId: '',
      userId: '',
      permissions: [FronteggPermissions.All],
      userPermissions: []
    };
  }

  return {
    tenantId: req.user.tenantId,
    userId: req.user.id,
    permissions: [FronteggPermissions.All],
    userPermissions: req.user.permissions
  };
};
