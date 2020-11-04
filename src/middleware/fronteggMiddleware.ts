import * as httpProxy from 'http-proxy';
import { FronteggAuthenticator } from '../authenticator';
import Logger from '../helpers/logger';
import { ContextHolder } from './ContextHolder';
import { fronteggRoutes } from './FronteggRoutes';
import { IFronteggOptions } from './types';
import { callMiddleware, enableCors, rewriteCookieDomain, validatePermissions } from './utils';

const proxy = httpProxy.createProxyServer({ secure: false, changeOrigin: true });
const target = process.env.FRONTEGG_API_GATEWAY_URL || 'https://api.frontegg.com/';

const authenticator = new FronteggAuthenticator();

const MAX_RETRIES = 3;

async function proxyRequest(req, res, context) {
  Logger.log(`going to proxy request - ${req.originalUrl} to ${target}`);
  await proxy.web(req, res, {
    target,
    headers: {
      'x-access-token': authenticator.accessToken,
      'frontegg-tenant-id': context && context.tenantId ? context.tenantId : '',
      'frontegg-user-id': context && context.userId ? context.userId : '',
      'frontegg-vendor-host': req.hostname,
    },
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


  ContextHolder.setContext({
    FRONTEGG_CLIENT_ID: options.clientId,
    FRONTEGG_API_KEY: options.apiKey,
  });

  const authInitedPromise = authenticator.init(options.clientId, options.apiKey);

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

    return proxyRequest(req, res, context);
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
    if (req.hostname) {
      proxyReq.setHeader('frontegg-vendor-host', req.hostname);
    }

    if (req.body) {
      const bodyData = Buffer.isBuffer(req.body) ? req.body : JSON.stringify(req.body);
      // in case if content-type is application/x-www-form-urlencoded -> we need to change to application/json
      proxyReq.setHeader('Content-Type', 'application/json');
      proxyReq.setHeader('Content-Length', Buffer.byteLength(bodyData));
      // stream the content
      proxyReq.write(bodyData);
    }
  });

  // tslint:disable-next-line:only-arrow-functions
  return async (req, res) => {
    await authInitedPromise;

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
    return proxyRequest(req, res, context);
  };
}



