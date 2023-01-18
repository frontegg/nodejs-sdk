import { HostedLoginClient } from './hosted-login.client';
import MockAdapter from 'axios-mock-adapter';
import axios from 'axios';
import { FronteggContext } from '../../components/frontegg-context';
import { config } from '../../config';
import { CodeExchangeResponse } from './types';

FronteggContext.init({
  FRONTEGG_CLIENT_ID: 'my-client-id',
  FRONTEGG_API_KEY: 'my-api-key',
});

jest.mock('../../authenticator');
describe('Hosted login client tests', () => {
  it('should create authorize endpoint', async () => {
    const axiosMock: MockAdapter = new MockAdapter(axios);
    const token = 'fake-token';
    const baseURL = 'https://vendor.base.url';
    try {
      axiosMock.onPost(config.urls.authenticationService).reply(200, { token, expiresIn: 1000 });
      axiosMock.onGet(`${config.urls.vendorsService}/base-url`).reply(200, { baseURL });
      const redirectURI = new URL('https://localhost:8080/test');
      const client = new HostedLoginClient(redirectURI);
      const state = 'my-state';
      const url: string = await client.requestAuthorize({ state });
      expect(url).toEqual(`https://vendor.base.url/oauth/authorize?response_type=code&client_id=${FronteggContext.getContext().FRONTEGG_CLIENT_ID}&scope=openid%2Bemail%2Bprofile&redirect_uri=https%3A%2F%2Flocalhost%3A8080%2Ftest&state=${state}`);
    } finally {
      axiosMock.reset();
    }
  });

  it('should exchange code for token', async () => {
    const axiosMock: MockAdapter = new MockAdapter(axios);
    const token = 'fake-token';
    const userData = {
      permissions: ['permission1'],
      roles: ['role1'],
      sub: 'identifier',
      tenantId: 'my-tenant-id',
      type: 'userToken',
    };
    const codeExchangeRes: { access_token: string, refresh_token: string } = {
      access_token: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJwZXJtaXNzaW9ucyI6WyJwZXJtaXNzaW9uMSJdLCJyb2xlcyI6WyJyb2xlMSJdLCJzdWIiOiJpZGVudGlmaWVyIiwidGVuYW50SWQiOiJteS10ZW5hbnQtaWQiLCJ0eXBlIjoidXNlclRva2VuIn0.gvkl8B3mXcka-s3gLI04l1UP3t8_q-05J4RYaHzoRKo',
      refresh_token: 'user-refresh-token',
    };
    try {
      axiosMock.onPost(config.urls.authenticationService).reply(200, { token, expiresIn: 1000 });
      axiosMock.onPost(`${config.urls.oauthService}/token`).reply(200, codeExchangeRes);
      const redirectURI = new URL('https://localhost:8080/test');
      const client = new HostedLoginClient(redirectURI);
      const state = 'my-state';
      const code = 'my-code';
      const res: CodeExchangeResponse = await client.codeExchange({ state, code });
      expect(res.accessToken).toEqual(codeExchangeRes.access_token)
      expect(res.refreshToken).toEqual(codeExchangeRes.refresh_token)
      expect(res.user).toEqual(userData)
    } finally {
      axiosMock.reset();
    }
  });
});
