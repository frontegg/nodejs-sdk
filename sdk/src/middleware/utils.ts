import Logger from '../helpers/logger';
import { FronteggPermissions } from '../permissions';
import { IncomingMessage } from 'http';

export let FRONTEGG_CLIENT_ID: string;
export let FRONTEGG_API_KEY: string;

const Whitelist = ['/metadata'];

export function getUrlWithoutQueryParams(req): string {
  return req.url.split('?').shift();
}

export function flattenPermissions(permissions: FronteggPermissions[]): string[] {
  const output: string[] = [];

  for (const p of permissions) {
    // noinspection SuspiciousTypeOfGuard
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

export async function validatePermissions(req, res, context) {
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


export function rewriteCookieDomain(header, oldDomain, newDomain) {
  if (Array.isArray(header)) {
    return header.map((headerElement) => {
      return rewriteCookieDomain(headerElement, oldDomain, newDomain);
    });
  }

  return header.replace(new RegExp(`(;\\s*domain=)${oldDomain};`, 'i'), `$1${newDomain};`);
}


export function enableCors(req, res: IncomingMessage) {
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


export async function callMiddleware(req, res, middleware): Promise<void> {
  const middlewareWrap: Promise<string> = new Promise(async (next, reject) => {
    try {
      await middleware(req, res, next);
    } catch (e) {
      reject(e);
    }

    next();
  });
  const nextValue: string = await middlewareWrap;
  if (nextValue) {
    throw new Error(nextValue);
  }
}
