import { IFronteggContext } from '../../components/frontegg-context/types';
import { FronteggContext } from '../../components/frontegg-context';
import { FronteggAuthenticator } from '../../authenticator';
import { EntitlementsClientOptions, VendorEntitlementsDto, VendorEntitlementsSnapshotOffsetDto } from './types';
import { config } from '../../config';
import { HttpClient } from '../http';
import Logger from '../../components/logger';
import { retry } from '../../utils';
import * as events from 'events';
import { EntitlementsClientEvents } from './entitlements-client.events';
import { TEntity } from '../identity/types';
import { EntitlementsUserScoped } from './entitlements.user-scoped';
import { CacheRevisionManager } from './storage/cache.revision-manager';
import { LocalCacheManager } from '../../cache';
import { hostname } from 'os';

export class EntitlementsClient extends events.EventEmitter {
  // periodical refresh handler
  private refreshTimeout: NodeJS.Timeout;
  private readonly readyPromise: Promise<EntitlementsClient>;
  private readonly options: EntitlementsClientOptions;

  // cache handler
  private cacheManager: CacheRevisionManager;

  private constructor(private readonly httpClient: HttpClient, options: Partial<EntitlementsClientOptions> = {}) {
    super();

    this.options = this.parseOptions(options);
    this.cacheManager = new CacheRevisionManager(
      this.options.instanceId,
      // TODO: use FronteggCache.getInstance(); when it's merged
      new LocalCacheManager()
    );

    this.readyPromise = new Promise((resolve) => {
      this.once(EntitlementsClientEvents.INITIALIZED, () => resolve(this));
    });

    this.on(EntitlementsClientEvents.SNAPSHOT_UPDATED, (offset) => {
      Logger.debug('[entitlements] Snapshot refreshed.', { offset });
    });

    this.refreshTimeout = setTimeout(
      () =>
        this.refreshSnapshot().then(() => {
          this.emit(EntitlementsClientEvents.INITIALIZED);
        }),
      this.options.initializationDelayMs,
    );
  }

  private parseOptions(givenOptions: Partial<EntitlementsClientOptions>): EntitlementsClientOptions {
    return {
      instanceId: hostname(),
      retry: { numberOfTries: 3, delayRangeMs: { min: 500, max: 5_000 } },
      initializationDelayMs: 0,
      refreshTimeoutMs: 30_000,
      ...givenOptions,
    };
  }

  public ready(): Promise<EntitlementsClient> {
    return this.readyPromise;
  }

  forUser<T extends TEntity>(entity: T): EntitlementsUserScoped<T> {
    const cache = this.cacheManager.getCache();
    if (!cache) {
      throw new Error('EntitlementsClient is not initialized yet.');
    }

    return new EntitlementsUserScoped<T>(entity, cache);
  }

  private async loadVendorEntitlements(): Promise<void> {
    const entitlementsData = await this.httpClient.get<VendorEntitlementsDto>('/api/v1/vendor-entitlements');
    const vendorEntitlementsDto = entitlementsData.data;

    const { isUpdated, rev } = await this.cacheManager.loadSnapshot(vendorEntitlementsDto);

    if (isUpdated) {
      // emit
      this.emit(EntitlementsClientEvents.SNAPSHOT_UPDATED, rev);
    }
  }

  private async refreshSnapshot(): Promise<void> {
    await this.cacheManager.waitUntilUpdated();

    await retry(async () => {
      if (!(await this.haveRecentSnapshot())) {
        Logger.debug('[entitlements] Refreshing the outdated snapshot.');

        await this.loadVendorEntitlements();
      }
    }, this.options.retry);

    this.refreshTimeout = setTimeout(() => this.refreshSnapshot(), this.options.refreshTimeoutMs);
  }

  private async haveRecentSnapshot(): Promise<boolean> {
    const serverOffsetDto = await this.httpClient.get<VendorEntitlementsSnapshotOffsetDto>(
      '/api/v1/vendor-entitlements-snapshot-offset',
    );
    return await this.cacheManager.hasRecentSnapshot(serverOffsetDto.data);
  }

  static async init(
    context: IFronteggContext = FronteggContext.getContext(),
    options: Partial<EntitlementsClientOptions> = {},
  ): Promise<EntitlementsClient> {
    const authenticator = new FronteggAuthenticator();
    await authenticator.init(context.FRONTEGG_CLIENT_ID, context.FRONTEGG_API_KEY);

    const httpClient = new HttpClient(authenticator, { baseURL: config.urls.entitlementsService });

    return new EntitlementsClient(httpClient, options);
  }

  destroy(): void {
    clearTimeout(this.refreshTimeout);
  }
}
