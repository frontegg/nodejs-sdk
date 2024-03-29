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
    public static metadataService = process.env.FRONTEGG_METADATA_SERVICE_URL || `${baseUrl}/metadata/`;
    public static eventService = process.env.FRONTEGG_EVENT_SERVICE_URL || `${baseUrl}/event`;
    public static identityService = process.env.FRONTEGG_IDENTITY_SERVICE_URL || `${baseUrl}/identity`;
    public static vendorsService = process.env.FRONTEGG_VENDORS_SERVICE_URL || `${baseUrl}/vendors`;
    public static oauthService = process.env.FRONTEGG_OAUTH_SERVICE_URL || `${baseUrl}/oauth`;
    public static entitlementsService = process.env.FRONTEGG_ENTITLEMENTS_SERVICE_URL || `${baseUrl}/entitlements`;
  }
}
