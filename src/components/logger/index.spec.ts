import { AxiosError, AxiosHeaders } from 'axios';
import MockAdapter from 'axios-mock-adapter';

let Logger: typeof import('./index').default;
beforeAll(async () => {
  const previous = process.env.FRONTEGG_DEBUG_LEVEL;
  process.env.FRONTEGG_DEBUG_LEVEL = 'debug';
  jest.resetModules();
  Logger = (await import('./index')).default;
  if (previous === undefined) delete process.env.FRONTEGG_DEBUG_LEVEL;
  else process.env.FRONTEGG_DEBUG_LEVEL = previous;
});

describe('emitted log safety', () => {
  it.each(['log', 'debug', 'info', 'warn', 'error'] as const)('%s sanitizes errors and metadata', (level) => {
    const write = jest.spyOn((console as any)._stdout || process.stdout, 'write').mockImplementation(() => true);
    const error = new AxiosError('secret-message', 'ERR_BAD_REQUEST', {
      headers: new AxiosHeaders({ Authorization: 'secret-header', Cookie: 'secret-cookie' }),
      data: 'secret-body',
      url: 'https://user:secret-url@example.com?code=secret-code',
      method: 'post',
    });
    error.response = { status: 401, data: { access_token: 'secret-response' } } as any;
    error.request = { _header: 'secret-wire' };
    const metadata: any = { refreshToken: 'secret-refresh', nested: { 'X-API-Key': 'secret-key' }, count: 2 };
    metadata.self = metadata;
    try {
      Logger[level]('request failed', error, metadata);
      const output = write.mock.calls.map(([chunk]) => String(chunk)).join('');
      expect(output).toContain('request failed');
      expect(output).toContain('401');
      expect(output).toContain('ERR_BAD_REQUEST');
      expect(output).toContain('post');
      expect(output).toContain('count');
      expect(output).not.toContain('secret-');
      expect(error.config?.headers.Authorization).toBe('secret-header');
      expect(metadata.refreshToken).toBe('secret-refresh');
    } finally {
      write.mockRestore();
    }
  });

  it('sanitizes an actual failed hosted-login exchange', async () => {
    const { HostedLoginClient } = await import('../../clients/hosted-login/hosted-login.client');
    const { FronteggContext } = await import('../frontegg-context');
    const { default: clientAxios } = await import('axios');
    FronteggContext.init({ FRONTEGG_CLIENT_ID: 'client', FRONTEGG_API_KEY: 'secret-api-key' });
    const mock = new MockAdapter(clientAxios);
    mock.onPost().reply(401, { errors: ['denied'], access_token: 'secret-response' });
    const client = new HostedLoginClient(new URL('https://example.test/callback'));
    (client as any)._authenticator = { accessToken: 'secret-vendor-token' };
    const write = jest.spyOn((console as any)._stdout || process.stdout, 'write').mockImplementation(() => true);
    try {
      await expect(client.codeExchange({ code: 'secret-code', state: 'secret-state' })).rejects.toThrow('[401]');
      const output = write.mock.calls.map(([chunk]) => String(chunk)).join('');
      expect(output).toContain('failed to exchange token with Frontegg');
      expect(output).toContain('401');
      expect(output).not.toContain('secret-');
      expect(output).not.toContain(Buffer.from('client:secret-api-key').toString('base64'));
    } finally {
      write.mockRestore();
      mock.restore();
    }
  });

  it('sanitizes a failed HTTP call logged by an SDK consumer', async () => {
    const { HttpClient } = await import('../../clients/http/http-client');
    const client = new HttpClient({ validateAuthentication: async () => {}, accessToken: 'secret-http' } as any);
    const mock = new MockAdapter(client.axios);
    mock.onGet().reply(503);
    const write = jest.spyOn((console as any)._stdout || process.stdout, 'write').mockImplementation(() => true);
    try {
      await client.get('/test', { Authorization: 'secret-auth' }).catch((error) => Logger.error('HTTP failed', error));
      const output = write.mock.calls.map(([chunk]) => String(chunk)).join('');
      expect(output).toContain('HTTP failed');
      expect(output).toContain('503');
      expect(output).not.toContain('secret-');
    } finally {
      write.mockRestore();
      mock.restore();
    }
  });
});
