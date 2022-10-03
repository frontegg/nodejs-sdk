// import mockAxios from 'jest-mock-axios';
import axios from 'axios';
import MockAdapter from 'axios-mock-adapter';
import { FronteggAuthenticator } from '../../authenticator';
import { HttpClient } from './http-client';

jest.mock('../../authenticator');

describe('http.client', () => {
  const authenticator = new FronteggAuthenticator();
  let httpClient: HttpClient;
  let mock: MockAdapter;

  const baseURL = 'https://api.fake-frontegg.com';
  const fakeToken = 'Bearer abc123456789';

  beforeAll(async () => {
    mock = new MockAdapter(axios);

    await authenticator.init('test123', 'test456');
    // set fake token
    Reflect.set(authenticator, 'accessToken', fakeToken);

    httpClient = new HttpClient(authenticator, {
      baseURL,
    });
  });

  afterAll(() => {
    mock.restore();
  });

  beforeEach(() => {
    (FronteggAuthenticator as jest.Mock).mockClear();
  });

  afterEach(() => {
    mock.reset();
  });

  it('should get', async () => {
    const mockGetRes = {
      userId: '12345',
      email: 'test@test.nl',
      userName: 'John Doe',
    };

    const url = '/foo/bar';

    mock
      .onGet(url, undefined, {
        asymmetricMatch: (headers) =>
          headers['frontegg-tenant-id'] === '12345' && headers['x-access-token'] === fakeToken,
      })
      .reply(200, mockGetRes);

    const res = await httpClient.get(url, {
      'frontegg-tenant-id': '12345',
    });

    expect(res.config.url).toEqual(`${baseURL}${url}`);
    expect(res.data).toEqual(mockGetRes);
  });

  it('should post', async () => {
    const mockPostRes = {
      userId: '12345',
      email: 'test@test.nl',
      userName: 'John Doe',
    };

    const data = {
      email: 'test@test.nl',
      password: '12345',
    };

    const url = '/identity/resources/users/v2/me';
    const alteredBaseURL = baseURL.replace('api', 'app-qwerty');

    mock
      .onPost(url, expect.objectContaining(data), {
        asymmetricMatch: (headers) =>
          headers['frontegg-vendor-host'] === 'app-qwerty' && headers['x-access-token'] === fakeToken,
      })
      .reply(201, mockPostRes);

    const res = await httpClient.post(url, data, {
      'frontegg-vendor-host': 'app-qwerty',
    });

    expect(res.data).toEqual(mockPostRes);
    expect(res.config.url).toEqual(`${alteredBaseURL}${url}`);
  });

  it('should put', async () => {
    const mockPutRes = {
      userId: '12345',
      email: 'john@dear.nl',
      userName: 'John Dear',
    };

    const data = {
      name: 'John Dear',
      phoneNumber: '1234567890',
    };

    const url = '/identity/resources/users/v2/me';

    mock
      .onPut(url, expect.objectContaining(data), {
        asymmetricMatch: (headers) => headers['x-access-token'] === fakeToken,
      })
      .reply(201, mockPutRes);

    const res = await httpClient.put(url, data);

    expect(res.data).toEqual(mockPutRes);
    expect(res.config.url).toEqual(`${baseURL}${url}`);
  });

  it('should delete', async () => {
    const url = '/identity/resources/users/v1/12345';

    mock
      .onDelete(url, undefined, {
        asymmetricMatch: (headers) => headers['x-access-token'] === fakeToken,
      })
      .reply(200);

    const res = await httpClient.delete(url);

    expect(res.data).toBe(undefined);
    expect(res.config.url).toEqual(`${baseURL}${url}`);
  });

  it('should patch', async () => {
    const mockPatchRes = {
      id: '12345',
      enforceMFAType: 'Force',
      allowRememberMyDevice: true,
      mfaDeviceExpiration: 123,
      createdAt: '2021-09-13',
      updatedAt: '2022-09-13',
    };

    const data = {
      enforceMFAType: 'Force',
      allowRememberMyDevice: true,
      mfaDeviceExpiration: 123,
    };

    const url = '/identity/resources/configurations/v1/mfa-policy';

    mock
      .onPatch(url, expect.objectContaining(data), {
        asymmetricMatch: (headers) =>
          headers['frontegg-tenant-id'] === '12345' && headers['x-access-token'] === fakeToken,
      })
      .reply(200, mockPatchRes);

    const res = await httpClient.patch(url, data, {
      'frontegg-tenant-id': '12345',
    });

    expect(res.data).toEqual(mockPatchRes);
    expect(res.config.url).toEqual(`${baseURL}${url}`);
  });
});
