import { FronteggPermissions } from '../../index';

export const contextResolver = (req) => {
  if (!req.user) {
    return {
      tenantId: 'NOT_A_REAL_TENANT_ID',
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
