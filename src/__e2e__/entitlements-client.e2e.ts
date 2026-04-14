import { EntitlementsClient } from '../clients/entitlements/entitlements-client';
import { FronteggContext } from '../components/frontegg-context';
import { E2E_CLIENT_ID, E2E_API_KEY, requireApiKey } from './setup';

describe('EntitlementsClient E2E', () => {
  let client: EntitlementsClient;

  beforeAll(async () => {
    requireApiKey();
    FronteggContext.init({
      FRONTEGG_CLIENT_ID: E2E_CLIENT_ID,
      FRONTEGG_API_KEY: E2E_API_KEY,
    });
    client = await EntitlementsClient.init();
    await client.ready();
  }, 30000);

  afterAll(() => {
    client?.destroy();
  });

  it('should initialize and load vendor entitlements', () => {
    expect(client).toBeDefined();
  });

  it('should create user-scoped client from entity', () => {
    const userScoped = client.forUser({
      sub: 'test-sub',
      tenantId: 'test-tenant',
      type: 5,
      userId: 'test-user',
    } as any);

    expect(userScoped).toBeDefined();
  });
});
