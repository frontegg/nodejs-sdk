import { FronteggAuthenticator } from './src/authenticator';
import { FronteggContext } from './src/components/frontegg-context';
import { withAuthentication } from './src/middlewares';
import {
  AuditsClient,
  EntitlementsClient,
  EventsClient,
  HttpClient,
  IdentityClient,
  StepupValidator,
} from './src/clients';

export {
  AuditsClient,
  FronteggContext,
  FronteggAuthenticator,
  withAuthentication,
  HttpClient,
  IdentityClient,
  EntitlementsClient,
  StepupValidator,
  EventsClient,
};
export * from './src/clients/hosted-login';
