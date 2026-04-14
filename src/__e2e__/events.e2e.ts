import { FronteggAuthenticator } from '../authenticator';
import { EventsClient } from '../clients/events/events';
import { E2E_CLIENT_ID, E2E_API_KEY, requireApiKey } from './setup';

describe('EventsClient E2E', () => {
  let authenticator: FronteggAuthenticator;
  let eventsClient: EventsClient;

  beforeAll(async () => {
    requireApiKey();
    authenticator = new FronteggAuthenticator();
    await authenticator.init(E2E_CLIENT_ID, E2E_API_KEY);
    eventsClient = new EventsClient(authenticator);
  });

  afterAll(async () => {
    await authenticator.shutdown();
  });

  it('should reject event without eventKey', async () => {
    await expect(
      eventsClient.send('test-tenant', {
        eventKey: '',
        data: { title: 'Test', description: 'Test event' },
      }),
    ).rejects.toThrow('Event key is required');
  });

  it('should reject event without data', async () => {
    await expect(
      eventsClient.send('test-tenant', {
        eventKey: 'test.event',
        data: { title: '', description: '' },
      } as any),
    ).rejects.toThrow();
  });
});
