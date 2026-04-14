import { FronteggAuthenticator } from '../authenticator';
import { HttpClient } from '../clients/http/http-client';
import { FronteggContext } from '../components/frontegg-context';
import { config } from '../config';
import { E2E_CLIENT_ID, E2E_API_KEY, requireApiKey } from './setup';
import axios from 'axios';

describe('IdentityClient E2E', () => {
  let authenticator: FronteggAuthenticator;

  beforeAll(async () => {
    requireApiKey();
    authenticator = new FronteggAuthenticator();
    await authenticator.init(E2E_CLIENT_ID, E2E_API_KEY);
  });

  afterAll(async () => {
    await authenticator.shutdown();
  });

  it('should fetch public key from Frontegg', async () => {
    const response = await axios.get(`${config.urls.identityService}/resources/configurations/v1`, {
      headers: { 'x-access-token': authenticator.accessToken },
    });

    expect(response.status).toBe(200);
    expect(response.data).toBeDefined();
    expect(response.data.publicKey).toBeTruthy();
    expect(response.data.publicKey).toContain('-----BEGIN');
  });

  it('should return configuration with expected shape', async () => {
    const response = await axios.get(`${config.urls.identityService}/resources/configurations/v1`, {
      headers: { 'x-access-token': authenticator.accessToken },
    });

    expect(response.data).toHaveProperty('publicKey');
    expect(typeof response.data.publicKey).toBe('string');
  });
});
