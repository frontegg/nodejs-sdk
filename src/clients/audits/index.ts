import axios from 'axios';
import { FronteggAuthenticator } from '../../authenticator';
import { config } from '../../config';
import Logger from '../../components/logger';

export class AuditsClient {
  private authenticator: FronteggAuthenticator = new FronteggAuthenticator();

  public async init(clientId: string, accessKey: string) {
    Logger.info('going to authenticate');
    await this.authenticator.init(clientId, accessKey);
    Logger.info('Authenticated with frontegg');
  }

  public async sendAudit(audits: any) {
    try {
      Logger.info('going to send audit');
      await this.authenticator.validateAuthentication();
      await axios.post(config.urls.auditsService, audits, {
        headers: {
          'x-access-token': this.authenticator.accessToken,
          'frontegg-tenant-id': audits.tenantId,
        },
      });
    } catch (e) {
      Logger.error('failed to send audit to audits service - ', e);
      throw e;
    }

    Logger.info('sent audit successfully');
  }

  // tslint:disable-next-line:max-line-length
  public async getAudits(params: {
    tenantId: string;
    filter?: string;
    sortBy?: string;
    sortDirection?: string;
    offset: number;
    count: number;
    filters: any;
  }) {
    Logger.info('going to get audits');
    const paramsToSend = { ...params, ...params.filters };
    delete paramsToSend.filters;

    await this.authenticator.validateAuthentication();
    const response = await axios.get(config.urls.auditsService, {
      params: paramsToSend,
      headers: {
        'x-access-token': this.authenticator.accessToken,
        'frontegg-tenant-id': params.tenantId,
      },
    });

    const { data } = response;
    return data;
  }

  public async getAuditsStats(params: { tenantId: string }) {
    Logger.info('going to get audits stats');
    const paramsToSend: any = { ...params };
    delete paramsToSend.filters;

    await this.authenticator.validateAuthentication();
    const response = await axios.get(`${config.urls.auditsService}/stats`, {
      params: paramsToSend,
      headers: {
        'x-access-token': this.authenticator.accessToken,
        'frontegg-tenant-id': params.tenantId,
      },
    });

    const { data } = response;
    return data;
  }

  public async getAuditsMetadata() {
    Logger.info('going to get audits metadata');
    const params = { entityName: 'audits' };
    await this.authenticator.validateAuthentication();
    const response = await axios.get(config.urls.metadataService, {
      params,
      headers: { 'x-access-token': this.authenticator.accessToken },
    });

    Logger.info('got audits metadata');
    const { data } = response;
    return data;
  }

  public async setAuditsMetadata(metadata: any) {
    // Make sure to override the entity name
    metadata.entityName = 'audits';
    Logger.info('going to update audits metadata');

    await this.authenticator.validateAuthentication();
    const response = await axios.post(config.urls.metadataService, metadata, {
      headers: { 'x-access-token': this.authenticator.accessToken },
    });

    Logger.info('done updating audits metadata');
    const { data } = response;
    return data;
  }

  public async exportPdf(
    params: { tenantId: string; filter?: string; sortBy?: string; sortDirection?: string; filters: any },
    properties: any[],
  ) {
    Logger.info('going to export audits to pdf');
    const paramsToSend = { ...params, ...params.filters };
    delete paramsToSend.filters;

    await this.authenticator.validateAuthentication();
    const response = await axios.post(
      `${config.urls.auditsService}/export/pdf`,
      { properties },
      {
        params: paramsToSend,
        responseType: 'blob',
        headers: {
          'x-access-token': this.authenticator.accessToken,
          'frontegg-tenant-id': params.tenantId,
        },
      },
    );

    const { data } = response;
    return data;
  }

  public async exportCsv(
    params: { tenantId: string; filter?: string; sortBy?: string; sortDirection?: string; filters: any },
    properties: any[],
  ) {
    Logger.info('going to export audits to pdf');
    const paramsToSend = { ...params, ...params.filters };
    delete paramsToSend.filters;

    await this.authenticator.validateAuthentication();
    const response = await axios.post(
      `${config.urls.auditsService}/export/csv`,
      { properties },
      {
        params: paramsToSend,
        responseType: 'blob',
        headers: {
          'x-access-token': this.authenticator.accessToken,
          'frontegg-tenant-id': params.tenantId,
        },
      },
    );

    const { data } = response;
    return data;
  }
}
