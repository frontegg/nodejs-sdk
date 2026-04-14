import MockAdapter from 'axios-mock-adapter';
import axios from 'axios';
import { EventsClient } from './events';
import { config } from '../../config';
import { NoDataException, NoEventKeyException, EventTrigger, EventStatus } from './types';
import { FronteggAuthenticator } from '../../authenticator';

jest.mock('../../authenticator');

describe('EventsClient', () => {
  let axiosMock;
  let authenticator: FronteggAuthenticator;
  let eventsClient: EventsClient;
  const tenantId = 'test-tenant-id';
  const fakeAccessToken = 'fake-access-token';

  const validEvent: EventTrigger = {
    eventKey: 'test-event-key',
    data: {
      title: 'Test Title',
      description: 'Test Description',
    },
  };

  beforeEach(() => {
    axiosMock = new MockAdapter(axios);
    authenticator = new FronteggAuthenticator();
    authenticator.accessToken = fakeAccessToken;
    (authenticator.validateAuthentication as jest.Mock).mockResolvedValue(undefined);
    eventsClient = new EventsClient(authenticator);
  });

  afterEach(() => {
    axiosMock.restore();
  });

  describe('send', () => {
    it('should throw NoEventKeyException when eventKey is missing', async () => {
      const ev = { data: { title: 'T', description: 'D' } } as EventTrigger;

      try {
        await eventsClient.send(tenantId, ev);
        fail('should throw');
      } catch (e) {
        expect(e).toBeInstanceOf(NoEventKeyException);
      }
    });

    it('should throw NoDataException when data.title is missing', async () => {
      const ev = { eventKey: 'key', data: { description: 'D' } } as EventTrigger;

      try {
        await eventsClient.send(tenantId, ev);
        fail('should throw');
      } catch (e) {
        expect(e).toBeInstanceOf(NoDataException);
      }
    });

    it('should throw NoDataException when data.description is missing', async () => {
      const ev = { eventKey: 'key', data: { title: 'T' } } as EventTrigger;

      try {
        await eventsClient.send(tenantId, ev);
        fail('should throw');
      } catch (e) {
        expect(e).toBeInstanceOf(NoDataException);
      }
    });

    it('should post to correct URL with tenant header and access token', async () => {
      const eventId = 'generated-event-id';
      axiosMock
        .onPost(`${config.urls.eventService}/resources/triggers/v3`)
        .reply(200, { eventId });

      await eventsClient.send(tenantId, validEvent);

      expect(axiosMock.history.post.length).toBe(1);
      const request = axiosMock.history.post[0];
      expect(request.headers?.['x-access-token']).toBe(fakeAccessToken);
      expect(request.headers?.['frontegg-tenant-id']).toBe(tenantId);
      expect(JSON.parse(request.data)).toEqual(validEvent);
    });

    it('should return eventId on success', async () => {
      const eventId = 'generated-event-id';
      axiosMock
        .onPost(`${config.urls.eventService}/resources/triggers/v3`)
        .reply(200, { eventId });

      const result = await eventsClient.send(tenantId, validEvent);

      expect(result).toBe(eventId);
    });

    it('should call validateAuthentication before sending', async () => {
      axiosMock
        .onPost(`${config.urls.eventService}/resources/triggers/v3`)
        .reply(200, { eventId: 'id' });

      await eventsClient.send(tenantId, validEvent);

      expect(authenticator.validateAuthentication).toHaveBeenCalled();
    });
  });

  describe('getStatus', () => {
    it('should get from correct URL and return EventStatus', async () => {
      const eventId = 'test-event-id';
      const status: EventStatus = {
        eventKey: 'test-event-key',
        eventId,
        channels: {
          email: { status: 'sent', errorMetadata: {} },
        },
      };

      axiosMock
        .onGet(`${config.urls.eventService}/resources/triggers/v3/${eventId}/statuses`)
        .reply(200, status);

      const result = await eventsClient.getStatus(eventId);

      expect(result).toEqual(status);
      expect(axiosMock.history.get[0].headers?.['x-access-token']).toBe(fakeAccessToken);
    });

    it('should call validateAuthentication before getting status', async () => {
      const eventId = 'test-event-id';
      axiosMock
        .onGet(`${config.urls.eventService}/resources/triggers/v3/${eventId}/statuses`)
        .reply(200, { eventKey: 'k', eventId, channels: {} });

      await eventsClient.getStatus(eventId);

      expect(authenticator.validateAuthentication).toHaveBeenCalled();
    });
  });
});
