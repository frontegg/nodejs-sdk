import { NextFunction, Request, Response } from 'express';
import { IncomingMessage, ServerResponse } from 'http';
import { FronteggPermissions } from '../permissions';


export interface IFronteggOptions {
  clientId: string;
  apiKey: string;
  contextResolver: fronteggContextResolver;
  authMiddleware?: AuthMiddleware;
  disableCors?: boolean;
  cookieDomainRewrite?: string;
  // default: 3
  maxRetries?: number;
}

export type fronteggContextResolver = (req: Request) => Promise<{ tenantId: string, userId: string, permissions: FronteggPermissions[] }>;
export type AuthMiddleware = (req: Request, res: Response, next: NextFunction) => Promise<any> | any;


// for NextJs
type ProxyIncomingMessage = IncomingMessage & Partial<{
  host: string;
  hostname: string;
  originalUrl: string;
}>;
type ProxyServerResponse<T = any> = ServerResponse & {
  status: (statusCode: number) => ProxyServerResponse<T>;
  send: (body: T) => void;
};
export interface INextHttpProxyMiddlewareOptions {
  pathRewrite?: { [key: string]: string };
}
export type INextJsFronteggOptions = IFronteggOptions & INextHttpProxyMiddlewareOptions;

