import { HostedLoginClient } from '../clients/hosted-login/hosted-login.client';
import { FronteggContext } from '../components/frontegg-context';
import { E2E_CLIENT_ID, E2E_API_KEY, requireApiKey } from './setup';

describe('HostedLoginClient E2E', () => {
  let client: HostedLoginClient;

  beforeAll(() => {
    requireApiKey();
    FronteggContext.init({
      FRONTEGG_CLIENT_ID: E2E_CLIENT_ID,
      FRONTEGG_API_KEY: E2E_API_KEY,
    });
    client = new HostedLoginClient(new URL('https://localhost:3000/callback'));
  });

  it('should generate authorization URL', async () => {
    const url = await client.requestAuthorize({});

    expect(url).toContain('/oauth/authorize');
    expect(url).toContain('response_type=code');
    expect(url).toContain(`client_id=${E2E_CLIENT_ID}`);
    expect(url).toContain('redirect_uri=');
    expect(url).toContain('scope=');
  });

  it('should include state in authorization URL when provided', async () => {
    const state = 'test-state-123';
    const url = await client.requestAuthorize({ state });

    expect(url).toContain(`state=${state}`);
  });

  it('should fail code exchange with invalid code', async () => {
    await expect(client.codeExchange({ code: 'invalid-code' })).rejects.toThrow();
  });
});
