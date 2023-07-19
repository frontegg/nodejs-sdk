import { PackageUtils } from '../../utils/package-loader';
import { IFronteggContext, IFronteggOptions, IFronteggCacheOptions } from './types';
import { IIORedisOptions, IRedisOptions } from '../cache/managers';

const DEFAULT_OPTIONS: IFronteggOptions = {
  cache: {
    type: 'local',
  },
};

export class FronteggContext {
  public static getInstance(): FronteggContext {
    if (!FronteggContext.instance) {
      FronteggContext.instance = new FronteggContext();
    }

    return FronteggContext.instance;
  }

  public static init(context: IFronteggContext, givenOptions?: Partial<IFronteggOptions>) {
    const options = FronteggContext.prepareOptions(givenOptions);
    FronteggContext.getInstance().validateOptions(options);
    FronteggContext.getInstance().options = options;

    FronteggContext.getInstance().context = context;
  }

  public static getContext(): IFronteggContext {
    return (
      FronteggContext.getInstance().context || {
        FRONTEGG_CLIENT_ID: '',
        FRONTEGG_API_KEY: '',
      }
    );
  }

  public static getOptions(): IFronteggOptions {
    return FronteggContext.getInstance().options;
  }

  private static instance: FronteggContext;
  private context: IFronteggContext | null = null;
  private options: IFronteggOptions;

  private constructor() {
    this.options = DEFAULT_OPTIONS;
  }

  private validateOptions(options: Partial<IFronteggOptions>): void {
    if (options.cache) {
      this.validateCacheOptions(options.cache);
    }
  }

  private validateCacheOptions(cache: IFronteggCacheOptions): void {
    if (cache.type === 'ioredis') {
      this.validateIORedisOptions(cache.options);
    } else if (cache.type === 'redis') {
      this.validateRedisOptions(cache.options);
    }
  }

  private validateIORedisOptions(redisOptions: IIORedisOptions): void {
    PackageUtils.loadPackage('ioredis');

    const requiredProperties: (keyof IIORedisOptions)[] = ['host', 'port'];
    requiredProperties.forEach((requiredProperty) => {
      if (redisOptions[requiredProperty] === undefined) {
        throw new Error(`${requiredProperty} is missing from ioredis cache options`);
      }
    });
  }

  private validateRedisOptions(redisOptions: IRedisOptions): void {
    PackageUtils.loadPackage('redis');

    const requiredProperties: (keyof IRedisOptions)[] = ['url'];
    requiredProperties.forEach((requiredProperty) => {
      if (redisOptions[requiredProperty] === undefined) {
        throw new Error(`${requiredProperty} is missing from redis cache options`);
      }
    });
  }

  private static prepareOptions(options?: Partial<IFronteggOptions>): IFronteggOptions {
    return {
      ...DEFAULT_OPTIONS,
      ...(options || {}),
    };
  }
}
