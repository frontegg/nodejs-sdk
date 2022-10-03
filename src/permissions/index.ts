export class FronteggPermissions {
  public static All = '*';

  public static Audits = {
    All: '* /audits',

    Read: 'GET /audits',
    Stats: 'GET /audits/stats',
    Export: ['POST /audits/export/pdf', 'POST /audits/export/csv'],
  };

  public static Notifications = {
    All: '* /notification',

    Read: 'GET /notification',
    ChangeStatus: 'PUT /notification/status',
    Pin: 'PUT /notification/pin',
    Unpin: 'PUT /notification/unpin',
    Webpush: 'POST /notification/subscriptions/webpush',
  };

  public static Tenants = {
    All: '* /tenants',

    Read: 'GET /tenants',
    Add: 'POST /tenants',
    Update: 'PATCH /tenants',
    Replace: 'PUT /tenants',
    Delete: 'DELETE /tenants',
    ReadKeyHistory: 'GET /tenants/history',
    AddTenantEvent: 'POST /tenants/events',
    ReadTenantEvent: 'GET /tenants/events',
  };

  public static Team = {
    All: '* /team',

    Read: ['GET /team', 'GET /team/roles'],
    Stats: 'GET /team/stats',
    Add: 'POST /team',
    Update: 'PUT /team',
    Delete: 'DELETE /team',
    ResendActivationEmail: 'POST /team/resendActivationEmail',
    ResetPassword: 'POST /team/resetPassword',
  };
}
