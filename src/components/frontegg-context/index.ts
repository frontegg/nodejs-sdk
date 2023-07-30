import { IIORedisCacheOptions, IRedisCacheOptions } from '../../cache/types';
import { PackageUtils } from '../../utils/package-loader';
import { IFronteggContext, IFronteggOptions, IAccessTokensOptions } from './types';

export class FronteggContext {
  public static getInstance(): FronteggContext {
    if (!FronteggContext.instance) {
      FronteggContext.instance = new FronteggContext();
    }

    return FronteggContext.instance;
  }

  public static init(context: IFronteggContext, options?: IFronteggOptions) {
    FronteggContext.getInstance().context = context;
    FronteggContext.getInstance().validateOptions(options);
    FronteggContext.getInstance().options = options ?? {};
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
    return FronteggContext.getInstance().options || {};
  }

  private static instance: FronteggContext;
  private context: IFronteggContext | null = null;
  private options: IFronteggOptions = {};

  private constructor() {}

  private validateOptions(options?: IFronteggOptions): void {
    if (options?.accessTokensOptions) {
      this.validateAccessTokensOptions(options.accessTokensOptions);
    }
  }

  private validateAccessTokensOptions(accessTokensOptions: IAccessTokensOptions): void {
    if (!accessTokensOptions.cache) {
      throw new Error(`'cache' is missing from access tokens options`);
    }

    if (accessTokensOptions.cache.type === 'ioredis') {
      this.validateIORedisOptions(accessTokensOptions.cache.options);
    } else if (accessTokensOptions.cache.type === 'redis') {
      this.validateRedisOptions(accessTokensOptions.cache.options);
    }
  }

  private validateIORedisOptions(redisOptions: IIORedisCacheOptions): void {
    PackageUtils.loadPackage('ioredis');

    const requiredProperties: (keyof IIORedisCacheOptions)[] = ['host', 'port'];
    requiredProperties.forEach((requiredProperty) => {
      if (redisOptions[requiredProperty] === undefined) {
        throw new Error(`${requiredProperty} is missing from ioredis cache options`);
      }
    });
  }

  private validateRedisOptions(redisOptions: IRedisCacheOptions): void {
    PackageUtils.loadPackage('redis');

    const requiredProperties: (keyof IRedisCacheOptions)[] = ['url'];
    requiredProperties.forEach((requiredProperty) => {
      if (redisOptions[requiredProperty] === undefined) {
        throw new Error(`${requiredProperty} is missing from redis cache options`);
      }
    });
  }
}
