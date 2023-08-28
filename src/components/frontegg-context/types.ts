import { IIORedisOptions, IRedisOptions } from '../cache/managers';

export interface IFronteggContext {
  FRONTEGG_CLIENT_ID: string;
  FRONTEGG_API_KEY: string;
}

export interface IFronteggOptions {
  cache: IFronteggCacheOptions;
}

export interface IBaseCacheOptions {
  type: 'ioredis' | 'local' | 'redis';
}

export interface ILocalCacheOptions extends IBaseCacheOptions {
  type: 'local';
}

export interface IIORedisCacheOptions extends IBaseCacheOptions {
  type: 'ioredis';
  options: IIORedisOptions;
}

export interface IRedisCacheOptions extends IBaseCacheOptions {
  type: 'redis';
  options: IRedisOptions;
}

export type IFronteggCacheOptions = ILocalCacheOptions | IIORedisCacheOptions | IRedisCacheOptions;
