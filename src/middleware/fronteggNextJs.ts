import * as httpProxy from 'http-proxy';
import { FronteggAuthenticator } from '../authenticator';
import Logger from '../helpers/logger';
import { ContextHolder } from './ContextHolder';
import { fronteggRoutes } from './FronteggRoutes';
import { INextJsFronteggOptions } from './types';
import { callMiddleware, enableCors, validatePermissions } from './utils';

const proxy = httpProxy.createProxyServer({ secure: false, changeOrigin: true });
const target = process.env.FRONTEGG_API_GATEWAY_URL || 'https://api.frontegg.com/';

const authenticator = new FronteggAuthenticator();
export let FRONTEGG_CLIENT_ID_NEXTJS: string;
export let FRONTEGG_API_KEY_NEXTJS: string;

export const rewritePath = (url: string, pathRewrite: { [key: string]: string }) => {
  let modifiedUrl = url;
  Object.keys(pathRewrite).forEach((patternStr: string) => {
    const pattern = RegExp(patternStr);
    const path = pathRewrite[patternStr];
    if (pattern.test(url as string)) {
      modifiedUrl = url.replace(pattern, path);
    }
  });
  return modifiedUrl;
};

/**
 * Next.js HTTP Proxy Middleware
 * @see https://nextjs.org/docs/api-routes/api-middlewares
 */
export const fronteggNextJs = (options: INextJsFronteggOptions) => {
  Logger.debug('you got to my frontegg middleware');

  if (!options) {
    throw new Error('Missing options');
  }
  if (!options.clientId) {
    throw new Error('Missing client ID');
  }
  if (!options.apiKey) {
    throw new Error('Missing api key');
  }
  if (!options.contextResolver) {
    throw new Error('Missing context resolver');
  }

  ContextHolder.setContext({
    FRONTEGG_CLIENT_ID: options.clientId,
    FRONTEGG_API_KEY: options.apiKey,
  });

  const authInitedPromise = authenticator.init(options.clientId, options.apiKey);

  return async (nextJsReq: any, nextJsRes: any) => {
    await authInitedPromise;

    const { pathRewrite } = options;
    if (pathRewrite) {
      nextJsReq.url = rewritePath(nextJsReq.url as string, pathRewrite);
    }
    nextJsReq.header = (headerName: string) => nextJsReq.headers[headerName];
    nextJsReq.host = (nextJsReq.headers.host || '').replace(/:.*/g, '');
    nextJsReq.hostname = nextJsReq.host;
    nextJsReq.originalUrl = nextJsReq.url;
    nextJsReq.path = nextJsReq.url.replace(/\?.*/g, '');

    if (options.authMiddleware && !await fronteggRoutes.isFronteggPublicRoute(nextJsReq)) {
      Logger.debug('will pass request threw the auth middleware');
      try {
        await callMiddleware(nextJsReq, nextJsRes, options.authMiddleware);
        if (nextJsRes.headersSent) {
          // response was already sent from the middleware, we have nothing left to do
          return;
        }
      } catch (e) {
        Logger.error(`Failed to call middleware - `, e);
        return nextJsRes.status(401).send(e.message);
      }
    }

    Logger.debug(`going to resolve resolve context`);
    const context = await options.contextResolver(nextJsReq);
    Logger.debug(`context resolved - ${JSON.stringify(context)}`);

    if (nextJsReq.method === 'OPTIONS') {
      // tslint:disable-next-line:no-console
      console.log('OPTIONS call to frontegg middleware - returning STATUS 204');
      nextJsRes.status(204).send();
      return;
    }

    Logger.debug(`going to validate permissions for - `, nextJsReq.url);
    try {
      await validatePermissions(nextJsReq, nextJsRes, context);
    } catch (e) {
      Logger.error('Failed at permissions check - ', e);
      return nextJsRes.status(403).send();
    }


    return new Promise((resolve, reject) => {

      if (['POST', 'PUT'].indexOf(nextJsReq.method as string) >= 0 && typeof nextJsReq.body === 'object') {
        nextJsReq.body = JSON.stringify(nextJsReq.body);
      }

      proxy.
        once('proxyReq', ((proxyReq: any, req: any): void => {
          if (['POST', 'PUT'].indexOf(req.method as string) >= 0 && typeof req.body === 'string') {
            try {
              proxyReq.write(req.body);
              proxyReq.end();
            } catch (e) {
              Logger.error('Failed to write to proxy - ', e);
              reject(e);
            }
          }
        }) as any)
        .once('proxyRes', ((proxyRes, req: any, res): void => {
          Logger.debug(`proxyRes - returned for ${req.originalUrl}`);

          if (!options.disableCors) {
            enableCors(req, proxyRes);
          } else {
            delete proxyRes.headers['access-control-allow-methods'];
            delete proxyRes.headers['access-control-allow-headers'];
            delete proxyRes.headers['access-control-allow-origin'];
            delete proxyRes.headers['access-control-allow-credentials'];
          }

          if (proxyRes.statusCode === 401) {
            Logger.log(`${req.url} failed with authentication error from proxy`);
          }

          resolve();
        }) as any)
        .once('error', reject)
        .web(nextJsReq, nextJsRes, {
          target,
          cookieDomainRewrite: options.cookieDomainRewrite,
          headers: {
            'x-access-token': authenticator.accessToken,
            'frontegg-tenant-id': context && context.tenantId ? context.tenantId : '',
            'frontegg-user-id': context && context.userId ? context.userId : '',
            'frontegg-authenticated-entity-id': context && context.authenticatedEntityId ? context.authenticatedEntityId : '',
            'frontegg-authenticated-entity-type': context && context.authenticatedEntityType ? context.authenticatedEntityType : '',
            'frontegg-vendor-host': nextJsReq.hostname,
          },
        });
    });
  };
};

