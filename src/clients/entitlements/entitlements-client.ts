import { IFronteggContext } from '../../components/frontegg-context/types';
import { FronteggContext } from '../../components/frontegg-context';
import { FronteggAuthenticator } from '../../authenticator';
import {
  EntitlementsDto,
  FeatureBundleDto,
  FeatureDto,
  IsEntitledResult,
  VendorEntitlementsDto,
  VendorEntitlementsSnapshotOffsetDto
} from './types';
import { config } from '../../config';
import { HttpClient } from '../http';
import Logger from "../../components/logger";

export class EntitlementsClient {

  // periodical refresh handler
  private readonly refreshInterval: NodeJS.Timeout;

  // snapshot data
  private features: FeatureDto[] = [];
  private bundles: FeatureBundleDto[] = [];
  private entitlements: EntitlementsDto[] = [];
  private offset: number = -1;

  private constructor(
    private readonly authenticator: FronteggAuthenticator,
    private readonly httpClient: HttpClient,
  ) {
    this.refreshInterval = setInterval(async () => {
      if (!await this.haveRecentSnapshot()) {
        Logger.debug('[entitlements] Refreshing the outdated snapshot.', { currentOffset: this.offset });

        await this.loadVendorEntitlements()
        Logger.debug('[entitlements] Snapshot refreshed.', { currentOffset: this.offset });
      }
    }, 30_000);
  }

  private async loadVendorEntitlements(): Promise<void> {
    const entitlementsData = await this.httpClient.get<VendorEntitlementsDto>('/api/vendor-entitlements');

    // TODO: this is a very simplified way of storing the data
    this.features = entitlementsData.data.data.features;
    this.bundles = entitlementsData.data.data.featureBundles;
    this.entitlements = entitlementsData.data.data.entitlements;

    this.offset = entitlementsData.data.snapshotOffset;
  }

  private async haveRecentSnapshot(): Promise<boolean> {
    const serverOffsetDto = await this.httpClient.get<VendorEntitlementsSnapshotOffsetDto>('/api/vendor-entitlements-snapshot-offset');
    const isRecent = serverOffsetDto.data.snapshotOffset === this.offset;

    Logger.debug('[entitlements] Offsets compared.', { isRecent, serverOffset: serverOffsetDto.data.snapshotOffset, localOffset: this.offset });

    return isRecent;
  }

  static async init(context: IFronteggContext = FronteggContext.getContext()): Promise<EntitlementsClient> {
    const authenticator = new FronteggAuthenticator();
    await authenticator.init(context.FRONTEGG_CLIENT_ID, context.FRONTEGG_API_KEY);

    const httpClient = new HttpClient(authenticator, { baseURL: config.urls.entitlementsService });

    const client = new EntitlementsClient(authenticator, httpClient);
    await client.loadVendorEntitlements();

    return client;
  }

  destroy(): void {
    clearInterval(this.refreshInterval);
  }

}