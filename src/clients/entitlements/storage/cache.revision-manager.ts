import { CacheValue, ICacheManager } from '../../../components/cache/managers';
import { VendorEntitlementsDto, VendorEntitlementsSnapshotOffsetDto } from '../types';
import { IEntitlementsCache } from './types';
import { FronteggEntitlementsCacheInitializer } from './frontegg-cache/frontegg.cache-initializer';
import Logger from '../../../components/logger';
import { retry } from '../../../utils';

const CURRENT_OFFSET_KEY = 'snapshot-offset';
const UPDATE_IN_PROGRESS_KEY = 'snapshot-updating';

export class CacheRevisionManager {
  private entitlementsCache?: IEntitlementsCache;

  constructor(
    public readonly instanceId: string,
    private readonly cache: ICacheManager<CacheValue>,
    private readonly options: {
      maxUpdateLockTime: number
    } = {
      maxUpdateLockTime: 5
    }
  ) {
  }

  async waitUntilUpdated(): Promise<void> {
    return new Promise((resolve, reject) => {
        retry(async () => {
          if (await this.isUpdateInProgress()) {
            throw new Error();
          }
        }, { numberOfTries: 3, delayRangeMs: {
          min: 100,
          max: 2000
        }})
          .then(resolve)
          .catch(err => reject(err));
    });
  }

  async loadSnapshot(dto: VendorEntitlementsDto): Promise<{ isUpdated: boolean, rev: number }> {
    await this.waitUntilUpdated();

    const currentOffset = await this.getOffset();
    if (currentOffset === dto.snapshotOffset) return { isUpdated: false, rev: currentOffset };

    await this.cache.set(UPDATE_IN_PROGRESS_KEY, this.instanceId, { expiresInSeconds: this.options.maxUpdateLockTime });

    // re-initialize the cache
    const newCache = await FronteggEntitlementsCacheInitializer.initialize(dto);
    const oldCache = this.entitlementsCache;

    this.entitlementsCache = newCache;
    await this.setOffset(dto.snapshotOffset);

    // clean
    await oldCache?.clear();
    await oldCache?.shutdown();

    return { isUpdated: true, rev: dto.snapshotOffset }
  }

  async hasRecentSnapshot(dto: VendorEntitlementsSnapshotOffsetDto): Promise<boolean> {
    const currentOffset = await this.getOffset();
    const isRecent = dto.snapshotOffset === currentOffset;

    Logger.debug('[entitlements] Offsets compared.', {
      isRecent,
      serverOffset: dto.snapshotOffset,
      localOffset: currentOffset,
    });

    return isRecent;
  }

  async isUpdateInProgress(): Promise<boolean> {
    return await this.cache.get(UPDATE_IN_PROGRESS_KEY) !== null;
  }

  private async setOffset(offset: number): Promise<void> {
    await this.cache.set(CURRENT_OFFSET_KEY, offset);
  }

  async getOffset(): Promise<number> {
    return await this.cache.get(CURRENT_OFFSET_KEY) || 0;
  }

  getCache(): IEntitlementsCache | undefined {
    return this.entitlementsCache;
  }
}