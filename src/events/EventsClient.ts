import axios from 'axios';
import { FronteggAuthenticator } from '../authenticator';
import { config } from '../config';
import Logger from '../helpers/logger';
import { channelTypes, ITriggerOptions } from './types';
import { IEventStatuses } from './types/EventStatuses.interface';

const POLLING_LIMIT = 20;
const POLLING_TIMEOUT = 3 * 1000;

export type EventStatusCallback = (status: IEventStatuses) => any

export class EventsClient {
  private authenticator: FronteggAuthenticator = new FronteggAuthenticator();

  public async init(clientId: string, accessKey: string) {
    Logger.info('going to authenticate');
    await this.authenticator.init(clientId, accessKey);
    Logger.info('Authenticated with frontegg');
  }

  /**
   * @deprecated triggerEvent function is deprecated, please use trigger function instead.
   */
  public async triggerEvent(eventKey: string, metadata: object, channels: channelTypes[] | channelTypes, tenantId: string) {
    Logger.warn('triggerEvent function is deprecated, please use trigger function instead.');
    if (!Array.isArray(channels)) {
      channels = [channels];
    }

    if (!eventKey) {
      Logger.warn('eventKey is required');
      throw new Error('eventKey is required');
    }

    if (!metadata) {
      Logger.warn('metadata is required');
      throw new Error('metadata is required');
    }

    if (!channels) {
      Logger.warn('channels is required');
      throw new Error('channels is required');
    }

    if (!tenantId) {
      Logger.warn('tenantId is required');
      throw new Error('tenantId is required');
    }

    try {
      Logger.info('going to trigger event');
      await this.authenticator.validateAuthentication();
      const response = await axios.post(`${config.urls.eventService}/resources/triggers/v1`, {
        eventKey,
        metadata,
        channels,
      }, {
        headers: {
          'x-access-token': this.authenticator.accessToken,
          'frontegg-tenant-id': tenantId,
        },
      });
      Logger.info('triggered event successfully');
      return response.data;
    } catch (e) {
      Logger.error('failed to trigger event ', e);
      throw e;
    }
  }

  public async trigger(options: ITriggerOptions, callback?: EventStatusCallback): Promise<{ eventId: string }> {
    if (!options.eventKey) {
      Logger.warn('eventKey is required');
      throw new Error('eventKey is required');
    }

    if (!options.channels || Object.keys(options.channels).length === 0) {
      Logger.warn('At least one channel should be configured');
      throw new Error('At least one channel should be configured');
    }

    if (!options.properties) {
      Logger.warn('eventKey is required');
      throw new Error('eventKey is required');
    }

    if (!options.properties.title) {
      Logger.warn('properties.title is required');
      throw new Error('properties.title is required');
    }

    if (!options.properties.description) {
      Logger.warn('properties.description is required');
      throw new Error('properties.description is required');
    }

    try {
      Logger.info('going to trigger event');
      await this.authenticator.validateAuthentication();
      const response = await axios.post<{ eventId: string }>(`${config.urls.eventService}/resources/triggers/v2`, {
        eventKey: options.eventKey,
        properties: options.properties,
        channels: options.channels,
      }, {
        headers: {
          'x-access-token': this.authenticator.accessToken,
          'frontegg-tenant-id': options.tenantId,
        },
      });
      Logger.info('triggered event successfully');
      if (callback) {
        Logger.info('found callback, will poll for event status');
        this.pollEventStatus(response.data.eventId, callback);
      }
      return response.data;
    } catch (e) {
      Logger.error('failed to trigger event ', e);
      throw e;
    }
  }

  private pollEventStatus(eventId: string, callback: EventStatusCallback) {
    let intervalCounter = 0;
    const interval = setInterval(async () => {
      Logger.info('will poll events statuses')
      try {
        await this.authenticator.validateAuthentication();
        const response = await axios.get<IEventStatuses>(`${config.urls.eventService}/resources/triggers/v2/statuses/${eventId}`, {
          headers: {
            'x-access-token': this.authenticator.accessToken,
          },
        });

        if (Object.values(response.data.channels).some(({ status }) => status === 'PENDING')) {
          Logger.info('there are still channels with pending status');
          intervalCounter++;
        } else {
          Logger.info('all channels statuses are not pending, will call callback');
          callback(response.data);
          clearInterval(interval);
        }

        if (intervalCounter >= POLLING_LIMIT) {
          Logger.info('there are still channels with pending status, but we passed the limit of the polling');
          callback(response.data);
          clearInterval(interval);
        }
      } catch (e) {
        Logger.error('could not get event status', e);
        clearInterval(interval);
        throw new Error('could not get event status');
      }
    }, POLLING_TIMEOUT);
    return;
  }
}

