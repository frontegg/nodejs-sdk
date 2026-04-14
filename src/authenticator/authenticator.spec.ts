import MockAdapter from 'axios-mock-adapter';
import axios from 'axios';
import { FronteggAuthenticator } from './index';
import { config } from '../config';

jest.useFakeTimers();

describe('FronteggAuthenticator', () => {
  let axiosMock;
  let authenticator: FronteggAuthenticator;
  const clientId = 'test-client-id';
  const apiKey = 'test-api-key';
  const fakeToken = 'fake-token';
  const expiresIn = 3600;

  beforeEach(() => {
    axiosMock = new MockAdapter(axios);
    authenticator = new FronteggAuthenticator();
    delete process.env.FRONTEGG_AUTHENTICATOR_NUMBER_OF_TRIES;
  });

  afterEach(() => {
    axiosMock.restore();
    jest.clearAllTimers();
  });

  describe('init', () => {
    it('should post to authenticationService with clientId and secret', async () => {
      axiosMock.onPost(config.urls.authenticationService).reply(200, { token: fakeToken, expiresIn });

      await authenticator.init(clientId, apiKey);

      expect(axiosMock.history.post.length).toBe(1);
      const requestData = JSON.parse(axiosMock.history.post[0].data);
      expect(requestData).toEqual({ clientId, secret: apiKey });
    });

    it('should set accessToken on success', async () => {
      axiosMock.onPost(config.urls.authenticationService).reply(200, { token: fakeToken, expiresIn });

      await authenticator.init(clientId, apiKey);

      expect(authenticator.accessToken).toBe(fakeToken);
    });

    it('should schedule refresh at 80% of expiresIn', async () => {
      axiosMock.onPost(config.urls.authenticationService).reply(200, { token: fakeToken, expiresIn });

      await authenticator.init(clientId, apiKey);

      expect(authenticator.accessToken).toBe(fakeToken);

      const newToken = 'refreshed-token';
      axiosMock.onPost(config.urls.authenticationService).reply(200, { token: newToken, expiresIn });

      jest.advanceTimersByTime(expiresIn * 1000 * 0.8);
      await Promise.resolve();
      await Promise.resolve();

      expect(axiosMock.history.post.length).toBe(2);
    });

    it('should set accessToken to empty string and throw on failure', async () => {
      process.env.FRONTEGG_AUTHENTICATOR_NUMBER_OF_TRIES = '1';
      axiosMock.onPost(config.urls.authenticationService).reply(401, { error: 'Unauthorized' });

      try {
        await authenticator.init(clientId, apiKey);
        fail('should throw');
      } catch (e: any) {
        expect(e.message).toBe('Failed to authenticate with Frontegg');
      }

      expect(authenticator.accessToken).toBe('');
    });

    it('should use FRONTEGG_AUTHENTICATOR_NUMBER_OF_TRIES env var for retries', async () => {
      jest.useRealTimers();
      process.env.FRONTEGG_AUTHENTICATOR_NUMBER_OF_TRIES = '1';
      const freshMock = new MockAdapter(axios);
      freshMock.onPost(config.urls.authenticationService).reply(401, { error: 'Unauthorized' });
      const freshAuth = new FronteggAuthenticator();

      try {
        await freshAuth.init(clientId, apiKey);
        fail('should throw');
      } catch (e: any) {
        expect(e.message).toBe('Failed to authenticate with Frontegg');
      }

      expect(freshMock.history.post.length).toBe(1);
      freshMock.restore();
      jest.useFakeTimers();
    });
  });

  describe('validateAuthentication', () => {
    it('should refresh when token is empty', async () => {
      axiosMock.onPost(config.urls.authenticationService).reply(200, { token: fakeToken, expiresIn });

      Reflect.set(authenticator, 'clientId', clientId);
      Reflect.set(authenticator, 'apiKey', apiKey);

      await authenticator.validateAuthentication();

      expect(authenticator.accessToken).toBe(fakeToken);
    });

    it('should refresh when token is expired', async () => {
      Reflect.set(authenticator, 'clientId', clientId);
      Reflect.set(authenticator, 'apiKey', apiKey);
      Reflect.set(authenticator, 'accessToken', 'old-token');
      Reflect.set(authenticator, 'accessTokenExpiry', Date.now() - 1000);

      axiosMock.onPost(config.urls.authenticationService).reply(200, { token: fakeToken, expiresIn });

      await authenticator.validateAuthentication();

      expect(authenticator.accessToken).toBe(fakeToken);
    });

    it('should do nothing when token is still valid', async () => {
      Reflect.set(authenticator, 'accessToken', fakeToken);
      Reflect.set(authenticator, 'accessTokenExpiry', Date.now() + 100000);

      await authenticator.validateAuthentication();

      expect(axiosMock.history.post.length).toBe(0);
      expect(authenticator.accessToken).toBe(fakeToken);
    });
  });

  describe('shutdown', () => {
    it('should clear the refresh timeout', async () => {
      axiosMock.onPost(config.urls.authenticationService).reply(200, { token: fakeToken, expiresIn });

      await authenticator.init(clientId, apiKey);
      await authenticator.shutdown();

      axiosMock.onPost(config.urls.authenticationService).reply(200, { token: 'new-token', expiresIn });

      jest.advanceTimersByTime(expiresIn * 1000);
      await Promise.resolve();

      expect(axiosMock.history.post.length).toBe(1);
    });
  });
});
