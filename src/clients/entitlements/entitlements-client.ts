import { IFronteggContext } from '../../components/frontegg-context/types';
import { FronteggContext } from '../../components/frontegg-context';
import { FronteggAuthenticator } from '../../authenticator';
import {
  EntitlementsClientGivenOptions,
  EntitlementsClientOptions,
  VendorEntitlementsDto,
  VendorEntitlementsSnapshotOffsetDto,
} from './types';
import { config } from '../../config';
import { HttpClient } from '../http';
import Logger from '../../components/logger';
import { retry } from '../../utils';
import { EntitlementsClientEventsEnum } from './entitlements-client-events.enum';
import { TEntity } from '../identity/types';
import { EntitlementsUserScoped } from './entitlements.user-scoped';
import { CacheRevisionManager } from './storage/cache.revision-manager';
import { CacheValue, ICacheManager } from '../../components/cache/managers';
import { hostname } from 'os';
import { FronteggCache } from '../../components/cache';
import { LeaderElection } from '../../components/leader-election';
import { TypedEmitter } from 'tiny-typed-emitter';
import { LeaderElectionFactory } from '../../components/leader-election/factory';

interface IEntitlementsClientEvents {
  [EntitlementsClientEventsEnum.INITIALIZED]: () => void;
  [EntitlementsClientEventsEnum.SNAPSHOT_UPDATED]: (revision: number) => void;
}

export class EntitlementsClient extends TypedEmitter<IEntitlementsClientEvents> {
  // periodical refresh handler
  private refreshTimeout?: NodeJS.Timeout;
  private readonly readyPromise: Promise<EntitlementsClient>;

  private cacheManager: CacheRevisionManager;

  private constructor(
    private readonly httpClient: HttpClient,
    cache: ICacheManager<CacheValue>,
    private readonly leaderElection: LeaderElection,
    private readonly options: EntitlementsClientOptions,
  ) {
    super();

    this.cacheManager = new CacheRevisionManager(cache);

    this.on(EntitlementsClientEventsEnum.SNAPSHOT_UPDATED, (offset) => {
      Logger.debug('[entitlements] Snapshot refreshed.', { offset });
    });

    this.readyPromise = this.setupInitialization();
    this.setupLeaderElection();
  }

  private setupInitialization(): Promise<EntitlementsClient> {
    this.once(EntitlementsClientEventsEnum.SNAPSHOT_UPDATED, () => {
      this.emit(EntitlementsClientEventsEnum.INITIALIZED);
    });

    return new Promise((resolve) => {
      this.once(EntitlementsClientEventsEnum.INITIALIZED, () => resolve(this));
    });
  }

  private setupLeaderElection(): void {
    this.leaderElection.on('leader', () => {
      this.stopPeriodicJob();
      this.setupLeaderPeriodicJob();
    });

    this.leaderElection.on('follower', () => {
      this.stopPeriodicJob();
      this.setupFollowerPeriodicJob();
    });

    this.leaderElection.start();
  }

  /**
   * This method starts the periodic job that tries to fetch the latest version of cache from Redis.
   * It's called only when current EntitlementsClient instance becomes the leader.
   */
  setupLeaderPeriodicJob(): void {
    this.refreshSnapshot();
  }

  /**
   * This method starts the periodic job that tries to swap the EntitlementsCache
   * to the latest available revision of RedisCache.
   *
   * It's called only when current EntitlementsClient instance becomes the follower.
   */
  setupFollowerPeriodicJob(): void {
    this.swapToLatestSnapshot();
  }

  stopPeriodicJob(): void {
    this.refreshTimeout && clearTimeout(this.refreshTimeout);
  }

  private static parseOptions(givenOptions: EntitlementsClientGivenOptions): EntitlementsClientOptions {
    return {
      instanceId: hostname(),
      retry: { numberOfTries: 3, delayRangeMs: { min: 500, max: 5_000 } },
      initializationDelayMs: 0,
      refreshTimeoutMs: 30_000,
      leaderElection: { key: 'entitlements_client_leader' },
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

    const { isUpdated, revision } = await this.cacheManager.loadSnapshotAsCurrent(vendorEntitlementsDto);

    if (isUpdated) {
      this.emit(EntitlementsClientEventsEnum.SNAPSHOT_UPDATED, revision);
    }
  }

  private async refreshSnapshot(): Promise<void> {
    await retry(async () => {
      if (!(await this.isCacheUpToDate())) {
        Logger.debug('[entitlements] Refreshing the outdated snapshot.');

        await this.loadVendorEntitlements();
      }
    }, this.options.retry);

    this.refreshTimeout = setTimeout(() => this.refreshSnapshot(), this.options.refreshTimeoutMs);
  }

  private async swapToLatestSnapshot(): Promise<void> {
    const { isUpdated, revision } = await this.cacheManager.followRevision(
      await this.cacheManager.getCurrentCacheRevision(),
    );
    if (isUpdated) {
      this.emit(EntitlementsClientEventsEnum.SNAPSHOT_UPDATED, revision);
    }

    this.refreshTimeout = setTimeout(() => this.swapToLatestSnapshot(), this.options.refreshTimeoutMs);
  }

  private async isCacheUpToDate(): Promise<boolean> {
    const serverOffsetDto = await this.httpClient.get<VendorEntitlementsSnapshotOffsetDto>(
      '/api/v1/vendor-entitlements-snapshot-offset',
    );
    return await this.cacheManager.hasGivenSnapshot(serverOffsetDto.data);
  }

  static async init(
    context: IFronteggContext = FronteggContext.getContext(),
    givenOptions: EntitlementsClientGivenOptions = {},
  ): Promise<EntitlementsClient> {
    const options = EntitlementsClient.parseOptions(givenOptions);

    const authenticator = new FronteggAuthenticator();
    await authenticator.init(context.FRONTEGG_CLIENT_ID, context.FRONTEGG_API_KEY);

    const httpClient = new HttpClient(authenticator, { baseURL: config.urls.entitlementsService });
    const cache = await FronteggCache.getInstance();

    return new EntitlementsClient(
      httpClient,
      cache,
      LeaderElectionFactory.fromCache(options.instanceId, cache, options.leaderElection),
      options,
    );
  }

  destroy(): void {
    this.refreshTimeout && clearTimeout(this.refreshTimeout);
  }
}