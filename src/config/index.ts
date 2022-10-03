export let baseUrl = process.env.FRONTEGG_API_GATEWAY_URL || 'https://api.frontegg.com/';
if (baseUrl.endsWith('/')) {
  // Take the base url
  baseUrl = baseUrl.slice(0, -1);
}

/* eslint-disable @typescript-eslint/no-namespace */
export namespace config {
  export class urls {
    public static authenticationService = process.env.FRONTEGG_AUTHENTICATION_SERVICE_URL || `${baseUrl}/auth/vendor`;
    public static auditsService = process.env.FRONTEGG_AUDITS_SERVICE_URL || `${baseUrl}/audits/`;
    public static notificationService = process.env.FRONTEGG_NOTIFICATION_SERVICE_URL || `${baseUrl}/notification/`;
    public static tenantsService = process.env.FRONTEGG_TENANTS_SERVICE_URL || `${baseUrl}/tenants/`;
    public static metadataService = process.env.FRONTEGG_METADATA_SERVICE_URL || `${baseUrl}/metadata/`;
    public static teamService = process.env.FRONTEGG_TEAM_MANAGEMENT_SERVICE_URL || `${baseUrl}/team`;
    public static eventService = process.env.FRONTEGG_EVENT_SERVICE_URL || `${baseUrl}/event`;
    public static identityService = process.env.FRONTEGG_IDENTITY_SERVICE_URL || `${baseUrl}/identity`;
    public static authzService = process.env.AUTHZ_SERVICE_URL || `http://localhost:8181`;
  }
}
