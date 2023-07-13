import { IIORedisOptions, IRedisOptions } from '../cache/managers';

export interface IFronteggContext {
  FRONTEGG_CLIENT_ID: string;
  FRONTEGG_API_KEY: string;
}

export interface IFronteggOptions {
  cache: IFronteggCacheOptions;
  accessTokensOptions?: IAccessTokensOptions;
}

export interface IAccessTokensOptions {
  cache: IFronteggCacheOptions;
}

export interface IAccessTokensCacheOptions {
  type: 'ioredis' | 'local' | 'redis';
}

export interface ILocalCacheOptions extends IAccessTokensCacheOptions {
  type: 'local';
}

export interface IIORedisCacheOptions extends IAccessTokensCacheOptions {
  type: 'ioredis';
  options: IIORedisOptions;
}

export interface IRedisCacheOptions extends IAccessTokensCacheOptions, IRedisOptions {
  type: 'redis';
  options: IRedisOptions;
}

export type IFronteggCacheOptions = ILocalCacheOptions | IIORedisCacheOptions | IRedisCacheOptions;
