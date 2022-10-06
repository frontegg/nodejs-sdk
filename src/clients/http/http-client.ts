import Axios, { AxiosInstance, AxiosRequestConfig, AxiosResponse } from 'axios';
import { FronteggAuthenticator } from '../../authenticator';

export class HttpClient {
  axios: AxiosInstance;

  constructor(private readonly authenticator: FronteggAuthenticator, axiosConfig?: AxiosRequestConfig) {
    this.axios = Axios.create(axiosConfig);
    this.setupRequestInterceptor();
  }

  private setupRequestInterceptor() {
    this.axios.interceptors.request.use(
      async (request: AxiosRequestConfig) => {
        await this.authenticator.validateAuthentication();

        request.headers = {
          ...request.headers,
          ['x-access-token']: this.authenticator.accessToken,
        };

        if (request.baseURL) {
          if (request.headers && request.headers['frontegg-vendor-host']) {
            request.baseURL = request.baseURL.replace('api', request.headers['frontegg-vendor-host'] as string);
          }
          // This will contruct a valid url in case the url starts with a '/' and the baseUrl end withs a '/'
          request.url = new URL(request.url || '', request.baseURL).href;
        }

        return request;
      },
      (err) => Promise.reject(err),
    );
  }

  public async get<T = any>(url: string, headers?: Record<string, any>): Promise<AxiosResponse<T>> {
    return this.axios.get(url, { headers });
  }

  public async post<T = any>(url: string, data: any, headers?: Record<string, any>): Promise<AxiosResponse<T>> {
    return this.axios.post(url, data, { headers });
  }

  public async put<T = any>(url: string, data: any, headers?: Record<string, any>): Promise<AxiosResponse<T>> {
    return this.axios.put(url, data, { headers });
  }

  public async delete<T = any>(url: string, headers?: Record<string, any>): Promise<AxiosResponse<T>> {
    return this.axios.delete(url, { headers });
  }

  public async patch<T = any>(url: string, data: any, headers?: Record<string, any>): Promise<AxiosResponse<T>> {
    return this.axios.patch(url, data, { headers });
  }
}
