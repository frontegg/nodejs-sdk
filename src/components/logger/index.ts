import * as winston from 'winston';
import { sanitize } from './sanitize';

const logger = winston.createLogger({
  level: process.env.FRONTEGG_DEBUG_LEVEL || 'error',
  format: winston.format.combine(winston.format.timestamp(), winston.format.simple()),
  transports: [
    new winston.transports.Console({
      format: winston.format.combine(winston.format.timestamp(), winston.format.colorize(), winston.format.simple()),
    }),
  ],
});

export default class Logger {
  public static log(message: string, ...meta: any[]) {
    logger.debug(message, sanitize(meta));
  }

  public static debug(message: string, ...meta: any[]) {
    logger.debug(message, sanitize(meta));
  }

  public static info(message: string, ...meta: any[]) {
    logger.info(message, sanitize(meta));
  }

  public static warn(message: string, ...meta: any[]) {
    logger.warn(message, sanitize(meta));
  }

  public static error(message: string, ...meta: any[]) {
    logger.error(message, sanitize(meta));
  }
}
