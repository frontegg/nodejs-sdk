import { FronteggAuthenticator } from './src/authenticator';
import { FronteggContext } from './src/components/frontegg-context';
import { withAuthentication } from './src/middlewares';
import {
  AuditsClient,
  EntitlementsClient,
  EventsClient,
  HttpClient,
  IdentityClient,
} from './src/clients';

export {
  AuditsClient,
  FronteggContext,
  FronteggAuthenticator,
  withAuthentication,
  HttpClient,
  IdentityClient,
  EntitlementsClient,
  EventsClient,
};
export * from './src/clients/hosted-login';
export * from './src/clients/identity';
