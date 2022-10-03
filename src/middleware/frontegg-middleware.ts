import * as httpProxy from 'http-proxy';
import { FronteggAuthenticator } from '../authenticator';
import Logger from '../helpers/logger';
import { getPackageJson } from '../utils/get-package-json';
import { ContextHolder } from './context-holder';
import { fronteggRoutes } from './frontegg-routes';
import { IFronteggOptions } from './types';
import { callMiddleware, enableCors, rewriteCookieDomain, validatePermissions } from './utils';

const proxy = httpProxy.createProxyServer({ secure: false, changeOrigin: true, xfwd: true });
const target = process.env.FRONTEGG_API_GATEWAY_URL || 'https://api.frontegg.com/';

const pjson = getPackageJson() || { version: 'unknown' };

const MAX_RETRIES = 3;

async function proxyRequest(req, res, context, authenticator) {
  await authenticator.validateAuthentication();
  Logger.log(`going to proxy request - ${req.originalUrl} to ${target}`);

  const headers = {
    'x-access-token': authenticator.accessToken,
    'frontegg-tenant-id': context && context.tenantId ? context.tenantId : 'WITHOUT_TENANT_ID',
    'frontegg-user-id': context && context.userId ? context.userId : '',
    'frontegg-vendor-host': req.hostname,
    'frontegg-middleware-client': `Node.js@${pjson.version}`,
    'frontegg-authenticated-entity-id': context.authenticatedEntityId,
    'frontegg-authenticated-entity-type': context.authenticatedEntityType,
  };

  if (context.userPermissions) {
    headers['frontegg-user-permissions'] = context.userPermissions.join(',');
  }

  await proxy.web(req, res, {
    target,
    headers,
  });
}

export function frontegg(options: IFronteggOptions) {
  const { maxRetries = MAX_RETRIES } = options;
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

  const authenticator = new FronteggAuthenticator();

  ContextHolder.setContext({
    FRONTEGG_CLIENT_ID: options.clientId,
    FRONTEGG_API_KEY: options.apiKey,
  });

  let authInitedPromise = authenticator.init(options.clientId, options.apiKey);

  proxy.on('error', async (err, req: any, res, _) => {
    Logger.error(`Failed proxy request to ${req.url} - `, err);
    req.frontegg.retryCount++;
    Logger.info(`retry count of ${req.url} - `, req.frontegg.retryCount);

    if (req.frontegg.retryCount >= maxRetries) {
      res.writeHead(500).end('Frontegg request failed');
      return;
    }

    // Get the context again
    const context = await options.contextResolver(req);

    return proxyRequest(req, res, context, authenticator);
  });

  proxy.on('proxyRes', async (proxyRes, req: any, res) => {
    Logger.debug(`proxyRes - returned for ${req.originalUrl}`);

    if (!options.disableCors) {
      enableCors(req, proxyRes);
    } else {
      delete proxyRes.headers['access-control-allow-methods'];
      delete proxyRes.headers['access-control-allow-headers'];
      delete proxyRes.headers['access-control-allow-origin'];
      delete proxyRes.headers['access-control-allow-credentials'];
    }

    if (options.cookieDomainRewrite) {
      const host = req.headers.host;

      Object.keys(proxyRes.headers).forEach((key) => {
        if (key.toLowerCase() === 'set-cookie') {
          proxyRes.headers[key] = rewriteCookieDomain(proxyRes.headers[key], host, options.cookieDomainRewrite);
        }
      });
    }
  });

  proxy.on('proxyReq', (proxyReq, req: any, res, _) => {
    try {
      if (req.hostname) {
        proxyReq.setHeader('frontegg-vendor-host', req.hostname);
      }

      // We are removing the authorization header as this is not used when proxying
      proxyReq.removeHeader('authorization');
      proxyReq.removeHeader('Authorization');

      if (req.body) {
        let contentType = proxyReq.getHeader('Content-Type') as string;
        let contentLength = proxyReq.getHeader('Content-Length') as number;
        if (contentType && contentType.startsWith('multipart/form-data')) {
          proxyReq.setHeader('Content-Type', contentType);
          proxyReq.setHeader('Content-Length', contentLength);
          return;
        }
        const bodyData = Buffer.isBuffer(req.body) ? req.body : JSON.stringify(req.body);
        contentType = 'application/json';
        contentLength = Buffer.byteLength(bodyData);
        proxyReq.write(bodyData);
      }
    } catch (e) {
      Logger.error('could not proxy request to frontegg', ...e);
    }
  });

  // tslint:disable-next-line:only-arrow-functions
  return async (req, res) => {
    try {
      await authInitedPromise;
    } catch (e) {
      Logger.error('Failed to authenticate via promise - ', e);
      authInitedPromise = authenticator.init(options.clientId, options.apiKey);
      throw e;
    }

    if (options.authMiddleware && !(await fronteggRoutes.isFronteggPublicRoute(req))) {
      Logger.debug('will pass request threw the auth middleware');
      try {
        await callMiddleware(req, res, options.authMiddleware);
        if (res.headersSent) {
          // response was already sent from the middleware, we have nothing left to do
          Logger.debug('Headers was already sent from authMiddleware');
          return;
        }
      } catch (e) {
        Logger.error(`Failed to call middleware - `, e);
        if (res.headersSent) {
          // response was already sent from the middleware, we have nothing left to do
          Logger.debug('authMiddleware threw error, but headers was already sent');
          return;
        }
        return res.status(401).send(e.message);
      }
    }

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

    if (!req.frontegg) {
      req.frontegg = {};
    }
    req.frontegg.retryCount = 0;

    Logger.debug(`going to proxy request`);
    return proxyRequest(req, res, context, authenticator);
  };
}
