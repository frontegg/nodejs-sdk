import { FronteggAuthenticator } from '../authenticator';
import { HttpClient } from '../clients/http/http-client';
import { config } from '../config';
import { E2E_CLIENT_ID, E2E_API_KEY, requireApiKey } from './setup';

describe('HttpClient E2E', () => {
  let authenticator: FronteggAuthenticator;
  let httpClient: HttpClient;

  beforeAll(async () => {
    requireApiKey();
    authenticator = new FronteggAuthenticator();
    await authenticator.init(E2E_CLIENT_ID, E2E_API_KEY);
    httpClient = new HttpClient(authenticator, {
      baseURL: config.urls.identityService,
    });
  });

  afterAll(async () => {
    await authenticator.shutdown();
  });

  it('should make authenticated GET request to Frontegg API', async () => {
    const response = await httpClient.get('/resources/configurations/v1/public');

    expect(response.status).toBe(200);
    expect(response.data).toBeDefined();
  });

  it('should include x-access-token in requests', async () => {
    const response = await httpClient.get('/resources/configurations/v1/public');

    expect(response.config.headers['x-access-token']).toBeTruthy();
  });
});
