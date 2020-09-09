import { NextFunction, Request, Response } from 'express';
import { IncomingMessage } from 'http';
import * as httpProxy from 'http-proxy';
import { stringify } from 'querystring';
import { FronteggAuthenticator } from '../authenticator';
import Logger from '../helpers/logger';
import { withAuthentication } from '../identity';
import { FronteggPermissions } from '../permissions';
import { fronteggRoutes } from './FronteggRoutes';

const proxy = httpProxy.createProxyServer({ secure: false, changeOrigin: true });
const target = process.env.FRONTEGG_API_GATEWAY_URL || 'https://api.frontegg.com/';

export let FRONTEGG_CLIENT_ID: string;
export let FRONTEGG_API_KEY: string;

const authenticator = new FronteggAuthenticator();

const Whitelist = ['/metadata'];

const MAX_RETRIES = 3;

function getUrlWithoutQueryParams(req): string {
  return req.url.split('?').shift();
}

declare type fronteggContextResolver = (req: Request) => Promise<{ tenantId: string, userId: string, permissions: FronteggPermissions[] }>;
declare type AuthMiddleware = (req: Request, res: Response, next: NextFunction) => Promise<any> | any;

export interface IFronteggOptions {
  clientId: string;
  apiKey: string;
  contextResolver: fronteggContextResolver;
  authMiddleware?: AuthMiddleware;
  disableCors?: boolean;
}

async function proxyRequest(req, res, context) {
  Logger.log(`going to proxy request - ${req.originalUrl} to ${target}`);

  await proxy.web(req, res, {
    target,
    headers: {
      'x-access-token': authenticator.accessToken,
      'frontegg-tenant-id': context && context.tenantId ? context.tenantId : '',
      'frontegg-user-id': context && context.userId ? context.userId : '',
    },
  });
}

function flattenPermissions(permissions: FronteggPermissions[]): string[] {
  const output: string[] = [];

  for (const p of permissions) {
    if (typeof (p) === 'string') {
      output.push(p);
    } else if (Array.isArray(p)) {
      for (const item of p) {
        output.push(item);
      }
    } else {
      Logger.log('running keys on  - ', p);
      const keys = Object.keys(p);
      for (const key of keys) {
        output.push(...flattenPermissions([p[key]]));
      }
    }
  }

  return output;
}

async function validatePermissions(req, res, context) {
  const permissions: FronteggPermissions[] = context.permissions;

  if (!permissions) {
    Logger.error('No permissions were passed for frontegg middleware');
    throw new Error('No permissions were passed for frontegg middleware');
  }

  if (!permissions.length) {
    Logger.error('Permissions array is empty for frontegg middleware');
    throw new Error('Permissions array is empty for frontegg middleware');
  }

  // We allow OPTIONS
  if (req.method === 'OPTIONS') {
    Logger.log('OPTIONS is allowed');
    return;
  }

  if (permissions.includes(FronteggPermissions.All)) {
    Logger.log('User is authorized for ALL actions in the system');
    return;
  }

  const url = getUrlWithoutQueryParams(req);

  for (const whiteListed of Whitelist) {
    if (url.startsWith(whiteListed)) {
      Logger.log(`URL ${url} is whitelisted`);
      return;
    }
  }

  const allowedOperations = flattenPermissions(permissions);
  Logger.log(`allowedOperations for this user - `, allowedOperations);

  for (const operation of allowedOperations) {
    if (operation === '*') {
      Logger.log(`All operations are allowed for this user`);
      return;
    }

    const allowedMethod = operation.split(' ')[0];
    const route = operation.split(' ')[1];

    if (allowedMethod === '*' && url.startsWith(route)) {
      Logger.log(`User is authorized for ALL route`);
      return;
    }

    if (url === route && req.method === allowedMethod) {
      Logger.log(`User is authorized for ${req.method} ${req.baseUrl}`);
      return;
    }

  }

  Logger.error(`No matching permission for ${req.method} ${url}. Permissions - ${allowedOperations}`);
  throw new Error(`No matching permission for ${req.method} ${url}`);
}

async function callMiddleware(req, res, middleware): Promise<void> {
  const middlewareWrap: Promise<string> = new Promise(async (next, reject) => {
    await middleware(req, res, next).catch(reject);
    next();
  });
  const nextValue: string = await middlewareWrap;
  if (nextValue) {
    throw new Error(nextValue);
  }
}

export function frontegg(options: IFronteggOptions) {
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
  if (!options.authMiddleware === undefined) {
    options.authMiddleware = withAuthentication();
  }

  FRONTEGG_CLIENT_ID = options.clientId;
  FRONTEGG_API_KEY = options.apiKey;

  authenticator.init(options.clientId, options.apiKey);

  proxy.on('error', async (err, req: any, res, _) => {
    Logger.error(`Failed proxy request to ${req.url} - `, err);
    req.frontegg.retryCount++;
    Logger.info(`retry count of ${req.url} - `, req.frontegg.retryCount);

    if (req.frontegg.retryCount >= MAX_RETRIES) {
      res.writeHead(500).end('Frontegg request failed');
      return;
    }

    // Get the context again
    const context = await options.contextResolver(req);
    proxyRequest(req, res, context);
  });

  proxy.on('proxyRes', async (proxyRes, req: any, res) => {
    Logger.debug(`proxyReq - returned for ${req.originalUrl}`);

    if (!options.disableCors) {
      enableCors(req, proxyRes);
    } else {
      delete proxyRes.headers['access-control-allow-methods'];
      delete proxyRes.headers['access-control-allow-headers'];
      delete proxyRes.headers['access-control-allow-origin'];
      delete proxyRes.headers['access-control-allow-credentials'];
    }

    if (proxyRes.statusCode === 401) {
      req.frontegg.retryCount = req.frontegg.retryCount + 1;
      Logger.log(`${req.url} failed with authentication error from proxy - retryCount - `, req.frontegg.retryCount);
      if (req.frontegg.retryCount <= MAX_RETRIES) {
        Logger.warn('going to refresh authentication');
        await authenticator.refreshAuthentication();
        Logger.warn('refreshed authentication');
        const context = await options.contextResolver(req);
        return proxyRequest(req, res, context);
      }
    }
  });

  function enableCors(req, res: IncomingMessage) {
    if (req.headers['access-control-request-method']) {
      Logger.debug(`enableCors - going to set access-control-request-method`);
      res.headers['access-control-allow-methods'] = req.headers['access-control-request-method'];
    }

    if (req.headers['access-control-request-headers']) {
      Logger.debug(`enableCors - going to set access-control-request-headers`);
      res.headers['access-control-allow-headers'] = req.headers['access-control-request-headers'];
    }

    if (req.headers.origin) {
      Logger.debug(`enableCors - going to set access-control-allow-origin to ${req.headers.origin}`);
      res.headers['access-control-allow-origin'] = req.headers.origin;
      res.headers['access-control-allow-credentials'] = 'true';
    }
  }

  proxy.on('proxyReq', (proxyReq, req: any, res, _) => {
    proxyReq.setHeader('frontegg-vendor-host', req.host);
    if (req.body) {
      const bodyData = JSON.stringify(req.body);
      // incase if content-type is application/x-www-form-urlencoded -> we need to change to application/json
      proxyReq.setHeader('Content-Type', 'application/json');
      proxyReq.setHeader('Content-Length', Buffer.byteLength(bodyData));
      // stream the content
      proxyReq.write(bodyData);
    }
  });

  // tslint:disable-next-line:only-arrow-functions
  return async function(req, res) {
    Logger.debug(`going to resolve resolve context`);
    const context = await options.contextResolver(req);
    Logger.debug(`context resolved - ${JSON.stringify(context)}`);

    if (req.method === 'OPTIONS') {
      // tslint:disable-next-line:no-console
      console.log('OPTIONS call to frontegg middleware - returning STATUS 204');
      res.status(204).send();
      return;
    }

    Logger.debug(`going to validate permissions for - `, req.url);
    try {
      await validatePermissions(req, res, context);
    } catch (e) {
      Logger.error('Failed at permissions check - ', e);
      return res.status(403).send();
    }

    if (options.authMiddleware && !await fronteggRoutes.isFronteggPublicRoute(req)) {
      Logger.debug('will pass request threw the auth middleware');
      try {
        await callMiddleware(req, res, options.authMiddleware);
        if (res.headersSent) {
          // response was already sent from the middleware, we have nothing left to do
          return;
        }
      } catch (e) {
        Logger.error(`Failed to call middleware - `, e);
        return res.status(401).send(e.message);
      }
    }


    if (!req.frontegg) {
      req.frontegg = {};
    }
    req.frontegg.retryCount = 0;

    Logger.debug(`going to proxy request`);
    proxyRequest(req, res, context);
  };
}
