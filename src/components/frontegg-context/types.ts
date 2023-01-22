import { IIORedisCacheOptions, IRedisCacheOptions } from "../../cache/types";

export interface IFronteggContext {
    FRONTEGG_CLIENT_ID: string;
    FRONTEGG_API_KEY: string;
}

export interface IFronteggOptions {
    accessTokensOptions?: IAccessTokensOptions;
}

export interface IAccessTokensOptions {
    cache: IAccessTokensLocalCache | IAccessTokensIORedisCache | IAccessTokensRedisCache;
}

export interface IAccessTokensCache {
    type: 'ioredis' | 'local' | 'redis';
}

export interface IAccessTokensLocalCache extends IAccessTokensCache {
    type: 'local';
}

export interface IAccessTokensIORedisCache extends IAccessTokensCache {
    type: 'ioredis';
    options: IIORedisCacheOptions;
}

export interface IAccessTokensRedisCache extends IAccessTokensCache {
    type: 'redis';
    options: IRedisCacheOptions;
}