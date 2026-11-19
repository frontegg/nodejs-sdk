import axios from 'axios';
import { FronteggAuthenticator } from '../../authenticator';
import { config } from '../../config';
import Logger from '../../components/logger';
import { AuditRequestParams, AuditV2RequestParams, GetAuditStatsParams, SendAuditParams } from './types';

export type { AuditV2RequestParams } from './types';

export class AuditsClient {
  private authenticator: FronteggAuthenticator = new FronteggAuthenticator();

  public async init(clientId: string, accessKey: string) {
    Logger.info('going to authenticate');
    await this.authenticator.init(clientId, accessKey);
    Logger.info('Authenticated with frontegg');
  }

  public async sendAudit(audit: SendAuditParams) {
    try {
      Logger.info('going to send audit');
      await this.authenticator.validateAuthentication();
      await axios.post(config.urls.auditsService, audit, {
        headers: {
          'x-access-token': this.authenticator.accessToken,
          'frontegg-tenant-id': audit.tenantId,
        },
      });
    } catch (e) {
      Logger.error('failed to send audit to audits service - ', e);
      throw e;
    }

    Logger.info('sent audit successfully');
  }

  public async getAudits(params: AuditRequestParams) {
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

  /** Retrieve a page of audits using the v2 API's structured filters. */
  public async getAuditsV2(params: AuditV2RequestParams) {
    const { tenantId, ...query } = params;
    await this.authenticator.validateAuthentication();
    const response = await axios.get(`${config.urls.auditsService.replace(/\/$/, '')}/resources/audits/v2`, {
      params: query,
      paramsSerializer: { indexes: null },
      headers: {
        'x-access-token': this.authenticator.accessToken,
        'frontegg-tenant-id': tenantId,
      },
    });
    return response.data;
  }

  public async getAuditsStats(params: GetAuditStatsParams) {
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
}
