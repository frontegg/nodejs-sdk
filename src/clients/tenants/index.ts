import axios from 'axios';
import { FronteggAuthenticator } from '../../authenticator';
import { config } from '../../config';
import Logger from '../../components/logger';

export class TenantsClient {
  private authenticator: FronteggAuthenticator = new FronteggAuthenticator();

  public async init(clientId: string, accessKey: string) {
    Logger.info('going to authenticate');
    await this.authenticator.init(clientId, accessKey);
    Logger.info('Authenticated with frontegg');
  }

  // tslint:disable-next-line:max-line-length
  public async getTenant(params: {
    tenantId: string;
    filter?: string;
    sortBy?: string;
    sortDirection?: string;
    offset: number;
    count: number;
    filters: any;
  }) {
    Logger.info('going to get Tenant');
    const paramsToSend = { ...params, ...params.filters };
    delete paramsToSend.filters;

    const response = await axios.get(config.urls.tenantsService, {
      params: paramsToSend,
      headers: {
        'x-access-token': this.authenticator.accessToken,
      },
    });

    const { data } = response;
    return data;
  }

  public async saveTenant(tenant: any) {
    try {
      Logger.info('going to save tenant');
      await axios.post(config.urls.tenantsService, tenant, {
        headers: {
          'x-access-token': this.authenticator.accessToken,
        },
      });
    } catch (e) {
      Logger.error('failed to save tenant to tenants service - ', e);
      throw e;
    }

    Logger.info('saved tenant successfully');
  }

  public async updateTenant(tenant: any) {
    try {
      Logger.info('going to update tenant');
      await axios.patch(config.urls.tenantsService, tenant, {
        headers: {
          'x-access-token': this.authenticator.accessToken,
        },
      });
    } catch (e) {
      Logger.error('failed to update tenant to tenants service - ', e);
      throw e;
    }

    Logger.info('updated tenant successfully');
  }

  public async replaceTenant(tenant: any) {
    try {
      Logger.info('going to replace tenant');
      await axios.put(config.urls.tenantsService, tenant, {
        headers: {
          'x-access-token': this.authenticator.accessToken,
        },
      });
    } catch (e) {
      Logger.error('failed to replace tenant to tenants service - ', e);
      throw e;
    }

    Logger.info('replaced tenant successfully');
  }

  // tslint:disable-next-line:max-line-length
  public async deleteTenant(params: {
    tenantId: string;
    filter?: string;
    sortBy?: string;
    sortDirection?: string;
    offset: number;
    count: number;
    filters: any;
  }) {
    Logger.info('going to delete a Tenant');
    const paramsToSend = { ...params, ...params.filters };
    delete paramsToSend.filters;

    const response = await axios.delete(config.urls.tenantsService, {
      params: paramsToSend,
      headers: {
        'x-access-token': this.authenticator.accessToken,
      },
    });

    const { data } = response;
    return data;
  }

  // tslint:disable-next-line:max-line-length
  public async getTenantEvent(params: {
    tenantId: string;
    filter?: string;
    sortBy?: string;
    sortDirection?: string;
    offset: number;
    count: number;
    filters: any;
  }) {
    Logger.info('going to get Tenant events');
    const paramsToSend = { ...params, ...params.filters };
    delete paramsToSend.filters;

    const response = await axios.get(`${config.urls.tenantsService}/events`, {
      params: paramsToSend,
      headers: {
        'x-access-token': this.authenticator.accessToken,
      },
    });

    const { data } = response;
    return data;
  }

  public async saveTenantEvent(tenantEvent: any) {
    try {
      Logger.info('going to save tenant event');
      await axios.post(`${config.urls.tenantsService}/events`, tenantEvent, {
        headers: {
          'x-access-token': this.authenticator.accessToken,
        },
      });
    } catch (e) {
      Logger.error('failed to save tenant event to tenants service - ', e);
      throw e;
    }

    Logger.info('saved tenant event successfully');
  }

  // tslint:disable-next-line:max-line-length
  public async getTenantKeyHistory(params: {
    tenantId: string;
    key: string;
    filter?: string;
    sortBy?: string;
    sortDirection?: string;
    offset: number;
    count: number;
    filters: any;
  }) {
    Logger.info('going to get tenant-key history');
    const paramsToSend = { ...params, ...params.filters };
    delete paramsToSend.filters;

    const response = await axios.get(`${config.urls.tenantsService}/history`, {
      params: paramsToSend,
      headers: {
        'x-access-token': this.authenticator.accessToken,
      },
    });

    const { data } = response;
    return data;
  }
}
