import axios from 'axios';
import MockAdapter from 'axios-mock-adapter';
import { AuditsClient } from './index';
import { FronteggAuthenticator } from '../../authenticator';
import { config } from '../../config';

jest.mock('../../authenticator');

describe('AuditsClient.getAuditsV2', () => {
  let mock: InstanceType<typeof MockAdapter>;
  let client: AuditsClient;
  let authenticator: jest.Mocked<FronteggAuthenticator>;
  const originalUrl = config.urls.auditsService;

  beforeEach(() => {
    jest.clearAllMocks();
    mock = new MockAdapter(axios);
    client = new AuditsClient();
    authenticator = (FronteggAuthenticator as jest.Mock).mock.instances[0];
    Reflect.set(authenticator, 'accessToken', 'test-vendor-token');
  });

  afterEach(() => {
    mock.restore();
    config.urls.auditsService = originalUrl;
  });

  it.each(['https://example.test/audits/', 'https://example.test/audits'])(
    'uses the configured audits URL %s and serializes structured filters',
    async (baseUrl) => {
      config.urls.auditsService = baseUrl;
      const params = {
        tenantId: 'tenant-1',
        count: 200,
        offset: 0,
        created_from: '2026-11-01T00:00:00Z',
        created_to: '2026-11-19T00:00:00Z',
        tenant_ids: ['tenant-1', 'tenant-2'],
        users: ['user-1', 'user-2'],
        email: ['a+b@example.test', 'other@example.test'],
        sortBy: 'createdAt' as const,
        sortDirection: 'DESC' as const,
        filter: '{"action":"login"}',
        featureFlagId: 'feature-1',
      };
      const response = { data: [{ frontegg_id: 'audit-1' }], total: 1 };
      mock.onGet('https://example.test/audits/resources/audits/v2').reply((request) => {
        const url = new URL(axios.getUri(request));
        expect(url.searchParams.getAll('users')).toEqual(params.users);
        expect(url.searchParams.getAll('email')).toEqual(params.email);
        expect(url.searchParams.getAll('tenant_ids')).toEqual(params.tenant_ids);
        expect(url.searchParams.has('tenantId')).toBe(false);
        expect(url.searchParams.get('offset')).toBe('0');
        expect(url.searchParams.get('created_from')).toBe(params.created_from);
        expect(url.searchParams.get('filter')).toBe(params.filter);
        const { tenantId, ...query } = params;
        expect(request.params).toEqual(query);
        expect(request.headers?.['frontegg-tenant-id']).toBe(tenantId);
        expect(request.headers?.['x-access-token']).toBe('test-vendor-token');
        expect(authenticator.validateAuthentication).toHaveBeenCalledTimes(1);
        return [200, response];
      });
      await expect(client.getAuditsV2(params)).resolves.toEqual(response);
      expect(mock.history.get).toHaveLength(1);
      expect(params.tenantId).toBe('tenant-1');
    },
  );

  it('sends only pagination when optional filters are omitted', async () => {
    mock.onGet().reply(200, { data: [], total: 0 });
    await expect(client.getAuditsV2({ tenantId: 'tenant-1', count: 1, offset: 0 })).resolves.toEqual({
      data: [],
      total: 0,
    });
    expect(mock.history.get[0].params).toEqual({ count: 1, offset: 0 });
  });

  it('uses the current tenant on each call', async () => {
    mock.onGet().reply(200, {});
    await client.getAuditsV2({ tenantId: 'tenant-1', count: 1, offset: 0 });
    await client.getAuditsV2({ tenantId: 'tenant-2', count: 1, offset: 200 });
    expect(mock.history.get.map((request) => request.headers?.['frontegg-tenant-id'])).toEqual([
      'tenant-1',
      'tenant-2',
    ]);
  });

  it.each([400, 401, 404, 500])('propagates HTTP %s', async (status) => {
    mock.onGet().reply(status);
    await expect(client.getAuditsV2({ tenantId: 'tenant-1', count: 1, offset: 0 })).rejects.toMatchObject({
      response: { status },
    });
  });

  it('propagates timeouts', async () => {
    mock.onGet().timeout();
    await expect(client.getAuditsV2({ tenantId: 'tenant-1', count: 1, offset: 0 })).rejects.toMatchObject({
      code: 'ECONNABORTED',
    });
  });

  it('does not request audits when authentication fails', async () => {
    authenticator.validateAuthentication.mockRejectedValueOnce(new Error('authentication failed'));
    await expect(client.getAuditsV2({ tenantId: 'tenant-1', count: 1, offset: 0 })).rejects.toThrow(
      'authentication failed',
    );
    expect(mock.history.get).toHaveLength(0);
  });
});
