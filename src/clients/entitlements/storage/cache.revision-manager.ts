import { CacheValue, ICacheManager } from '../../../components/cache/managers';
import { VendorEntitlementsDto, VendorEntitlementsSnapshotOffsetDto } from '../types';
import { IEntitlementsCache } from './types';
import { FronteggEntitlementsCacheInitializer } from './frontegg-cache/frontegg.cache-initializer';
import Logger from '../../../components/logger';

export const CURRENT_CACHE_REVISION = 'latest-cache-rev';

type IsUpdatedToRev = { isUpdated: boolean; revision: number };

export class CacheRevisionManager {
  private entitlementsCache?: IEntitlementsCache;

  private localRev?: number;

  constructor(private readonly cache: ICacheManager<CacheValue>) {}

  async loadSnapshotAsCurrent(dto: VendorEntitlementsDto): Promise<IsUpdatedToRev> {
    const currentRevision = await this.getCurrentCacheRevision();
    const givenRevision = dto.snapshotOffset;

    if (currentRevision === givenRevision) return { isUpdated: false, revision: currentRevision };

    // re-initialize the cache
    const oldCache = this.entitlementsCache;
    this.entitlementsCache = await FronteggEntitlementsCacheInitializer.forLeader(dto);

    await this.setCurrentCacheRevision(givenRevision);
    this.localRev = givenRevision;

    // clean
    await oldCache?.clear();

    return { isUpdated: true, revision: givenRevision };
  }

  async followRevision(revision: number): Promise<IsUpdatedToRev> {
    if (revision && this.localRev !== revision) {
      this.localRev = revision;

      // trigger the revision update here
      this.entitlementsCache = await FronteggEntitlementsCacheInitializer.forFollower(revision);

      return { isUpdated: true, revision };
    }

    return { isUpdated: false, revision: this.localRev || 0 };
  }

  async hasGivenSnapshot(dto: VendorEntitlementsSnapshotOffsetDto): Promise<boolean> {
    const currentOffset = await this.getCurrentCacheRevision();
    const isEqual = dto.snapshotOffset === currentOffset;

    Logger.debug('[entitlements] Offsets compared.', {
      isEqual,
      serverOffset: dto.snapshotOffset,
      localOffset: currentOffset,
    });

    return isEqual;
  }

  private async setCurrentCacheRevision(offset: number): Promise<void> {
    await this.cache.set(CURRENT_CACHE_REVISION, offset);
  }

  async getCurrentCacheRevision(): Promise<number> {
    return (await this.cache.get(CURRENT_CACHE_REVISION)) || 0;
  }

  getCache(): IEntitlementsCache | undefined {
    return this.entitlementsCache;
  }
}
