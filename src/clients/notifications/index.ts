import axios from 'axios';
import { FronteggAuthenticator } from '../../authenticator';
import { config } from '../../config';
import Logger from '../../components/logger';

export class NotificationsClient {
  private authenticator: FronteggAuthenticator = new FronteggAuthenticator();

  public async init(clientId: string, accessKey: string) {
    Logger.info('going to authenticate');
    await this.authenticator.init(clientId, accessKey);
    Logger.info('Authenticated with frontegg');
  }

  public async sendToUser(userId: string, tenantId: string, notification: INotificationParams): Promise<any> {
    if (!userId) {
      if (!userId) {
        throw new Error('Missing userId');
      }
    }
    if (!tenantId) {
      if (!tenantId) {
        throw new Error('Missing tenantId');
      }
    }
    return await this.sendNotification({ ...notification, userId, tenantId });
  }

  public async sendToTenantUsers(tenantId: string, notification: INotificationParams): Promise<any> {
    if (!tenantId) {
      if (!tenantId) {
        throw new Error('Missing tenantId');
      }
    }
    return await this.sendNotification({ ...notification, userId: null, tenantId });
  }

  public async sendToAllUsers(notification: INotificationParams): Promise<any> {
    return await this.sendNotification({ ...notification, userId: null, tenantId: null });
  }

  private async sendNotification(notificationDto: INotificationDto): Promise<any> {
    try {
      Logger.info('going to send notification');
      await this.authenticator.validateAuthentication();
      const response = await axios.post(config.urls.notificationService, notificationDto, {
        headers: {
          'x-access-token': this.authenticator.accessToken,
        },
      });
      return response.data;
    } catch (e) {
      Logger.error('failed to send notification to notifications service - ', e);
      throw e;
    }
    Logger.info('sent notification successfully');
  }

  // will be available in the future
  private async getNotifications(params: { tenantId: string; userId: string; offset?: number; count?: number }) {
    Logger.info('going to get notifications');
    const paramsToSend = {
      count: params.count,
      offset: params.offset,
    };

    const response = await axios.get(config.urls.notificationService, {
      params: paramsToSend,
      headers: {
        'x-access-token': this.authenticator.accessToken,
        'frontegg-tenant-id': params.tenantId,
        'frontegg-user-id': params.userId,
      },
    });

    const { data } = response;
    return data;
  }
}

export interface INotificationDto extends INotificationParams {
  userId: string | null;
  tenantId: string | null;
}

export interface INotificationParams {
  title?: string;
  body?: string;
  url?: string;
  severity?: string;
  actions?: INotificationAction[];
  expiryDate?: Date;
  channels?: INotificationChannels;
}

export interface INotificationAction {
  name: string;
  url?: string;
  method: string;
  visualization: string;
}

export interface INotificationChannels {
  webpush?: boolean;
}
