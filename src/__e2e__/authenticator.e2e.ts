import { FronteggAuthenticator } from '../authenticator';
import { E2E_CLIENT_ID, E2E_API_KEY, requireApiKey } from './setup';

describe('FronteggAuthenticator E2E', () => {
  let authenticator: FronteggAuthenticator;

  beforeAll(() => {
    requireApiKey();
  });

  beforeEach(() => {
    authenticator = new FronteggAuthenticator();
  });

  afterEach(async () => {
    await authenticator.shutdown();
  });

  it('should authenticate with real Frontegg credentials', async () => {
    await authenticator.init(E2E_CLIENT_ID, E2E_API_KEY);

    expect(authenticator.accessToken).toBeTruthy();
    expect(typeof authenticator.accessToken).toBe('string');
    expect(authenticator.accessToken.length).toBeGreaterThan(10);
  });

  it('should refresh authentication', async () => {
    await authenticator.init(E2E_CLIENT_ID, E2E_API_KEY);
    const firstToken = authenticator.accessToken;

    await authenticator.refreshAuthentication();

    expect(authenticator.accessToken).toBeTruthy();
    expect(typeof authenticator.accessToken).toBe('string');
  });

  it('should validate authentication without error when token is valid', async () => {
    await authenticator.init(E2E_CLIENT_ID, E2E_API_KEY);

    await expect(authenticator.validateAuthentication()).resolves.not.toThrow();
  });

  it('should fail with invalid credentials', async () => {
    await expect(authenticator.init('invalid-client-id', 'invalid-api-key')).rejects.toThrow(
      'Failed to authenticate with Frontegg',
    );
  });
});
