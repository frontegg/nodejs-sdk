import { FronteggAuthenticator } from './src/authenticator';
import { FronteggContext } from './src/components/frontegg-context';
import { withAuthentication, validatePermissions } from './src/middlewares';
import { AuditsClient, HttpClient, IdentityClient } from './src/clients';

export { AuditsClient, FronteggContext, FronteggAuthenticator, withAuthentication, HttpClient, IdentityClient, validatePermissions};
export * from './src/clients/hosted-login';
