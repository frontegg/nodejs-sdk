import { IFronteggContext } from '../../components/frontegg-context/types';
import { FronteggContext } from '../../components/frontegg-context';
import { FronteggAuthenticator } from '../../authenticator';
import { EntitlementsClientOptions, VendorEntitlementsSnapshotOffsetDto } from './types';
import { config } from '../../config';
import { HttpClient } from '../http';
import Logger from '../../components/logger';
import { retry } from '../../utils';
import * as events from 'events';
import { EntitlementsClientEvents } from './entitlements-client.events';
import { EntitlementsCache } from './storage/types';
import { InMemoryEntitlementsCache } from './storage/in-memory/in-memory.cache';
import { TEntity, TUserEntity } from '../identity/types';
import { EntitlementsUserScoped } from './entitlements.user-scoped';
import type { VendorEntitlementsV1 } from './api-types';
import { IdentityClient } from '../identity';
import { CustomAttributes, prepareAttributes } from '@frontegg/entitlements-javascript-commons';
import { appendUserIdAttribute } from './helpers/frontegg-entity.helper';

export class EntitlementsClient extends events.EventEmitter {
  // periodical refresh handler
  private refreshTimeout: NodeJS.Timeout;
  private readonly readyPromise: Promise<EntitlementsClient>;
  private readonly options: EntitlementsClientOptions;

  // cache instance
  private cache?: EntitlementsCache;

  // snapshot data
  private offset: number = -1;

  private constructor(private readonly httpClient: HttpClient, options: Partial<EntitlementsClientOptions> = {}) {
    super();

    this.options = this.parseOptions(options);

    this.readyPromise = new Promise((resolve) => {
      this.once(EntitlementsClientEvents.INITIALIZED, () => resolve(this));
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
      retry: { numberOfTries: 3, secondsDelayRange: { min: 0.5, max: 5 } },
      initializationDelayMs: 0,
      refreshTimeoutMs: 30_000,
      ...givenOptions,
    };
  }

  public ready(): Promise<EntitlementsClient> {
    return this.readyPromise;
  }

  forUser<T extends TEntity>(entity: T): EntitlementsUserScoped<T> {
    if (!this.cache) {
      throw new Error('EntitlementsClient is not initialized yet.');
    }

    return new EntitlementsUserScoped<T>(entity, this.cache);
  }

  async forFronteggToken(token: string): Promise<EntitlementsUserScoped> {
    if (!this.cache) {
      throw new Error('EntitlementsClient is not initialized yet.');
    }

    const tokenData = await IdentityClient.getInstance().validateToken(token);
    const customAttributes = appendUserIdAttribute(
      prepareAttributes({
        jwt: tokenData,
      }) as CustomAttributes,
      tokenData as TUserEntity,
    );

    return new EntitlementsUserScoped(tokenData, this.cache, customAttributes);
  }

  private async loadVendorEntitlements(): Promise<void> {
    const entitlementsData = await this.httpClient.get<VendorEntitlementsV1.GetDTO>('/api/v1/vendor-entitlements');

    const vendorEntitlementsDto = entitlementsData.data;
    const newOffset = entitlementsData.data.snapshotOffset;

    const newCache = await InMemoryEntitlementsCache.initialize(vendorEntitlementsDto, newOffset.toString());
    const oldCache = this.cache;

    this.cache = newCache;
    this.offset = entitlementsData.data.snapshotOffset;

    // clean
    await oldCache?.clear();
    await oldCache?.shutdown();

    // emit
    this.emit(EntitlementsClientEvents.SNAPSHOT_UPDATED, entitlementsData.data.snapshotOffset);
  }

  private async refreshSnapshot(): Promise<void> {
    await retry(async () => {
      if (!(await this.haveRecentSnapshot())) {
        Logger.debug('[entitlements] Refreshing the outdated snapshot.', { currentOffset: this.offset });

        await this.loadVendorEntitlements();
        Logger.debug('[entitlements] Snapshot refreshed.', { currentOffset: this.offset });
      }
    }, this.options.retry);

    this.refreshTimeout = setTimeout(() => this.refreshSnapshot(), this.options.refreshTimeoutMs);
  }

  private async haveRecentSnapshot(): Promise<boolean> {
    const serverOffsetDto = await this.httpClient.get<VendorEntitlementsSnapshotOffsetDto>(
      '/api/v1/vendor-entitlements-snapshot-offset',
    );
    const isRecent = serverOffsetDto.data.snapshotOffset === this.offset;

    Logger.debug('[entitlements] Offsets compared.', {
      isRecent,
      serverOffset: serverOffsetDto.data.snapshotOffset,
      localOffset: this.offset,
    });

    return isRecent;
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
