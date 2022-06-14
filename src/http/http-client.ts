import axios from "axios";
import { FronteggAuthenticator } from "../authenticator";

export class HttpClient {
  constructor(private readonly authenticator: FronteggAuthenticator) {}

  public async get(url: string, heeders: any): Promise<any> {
    await this.authenticator.validateAuthentication();
    return axios.get(url, {
      headers: {
        ...(heeders || {}),
        "x-access-token": this.authenticator.accessToken,
      },
    });
  }

  public async post(url: string, data: any, headers: any): Promise<any> {
    await this.authenticator.validateAuthentication();
    return axios.post(url, data, {
      headers: {
        ...(headers || {}),
        "x-access-token": this.authenticator.accessToken,
      },
    });
  }

  public async put(url: string, data: any, headers: any): Promise<any> {
    await this.authenticator.validateAuthentication();
    return axios.put(url, data, {
      headers: {
        ...(headers || {}),
        "x-access-token": this.authenticator.accessToken,
      },
    });
  }

  public async delete(url: string, headers: any): Promise<any> {
    await this.authenticator.validateAuthentication();
    return axios.delete(url, {
      headers: {
        ...(headers || {}),
        "x-access-token": this.authenticator.accessToken,
      },
    });
  }

  public async patch(url: string, headers: any): Promise<any> {
    await this.authenticator.validateAuthentication();
    return axios.patch(url, {
      headers: {
        ...(headers || {}),
        "x-access-token": this.authenticator.accessToken,
      },
    });
  }
}
