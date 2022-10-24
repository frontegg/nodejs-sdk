import * as winston from 'winston';

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
    logger.debug(message, meta);
  }

  public static debug(message: string, ...meta: any[]) {
    logger.debug(message, meta);
  }

  public static info(message: string, ...meta: any[]) {
    logger.info(message, meta);
  }

  public static warn(message: string, ...meta: any[]) {
    logger.warn(message, meta);
  }

  public static error(message: string, ...meta: any[]) {
    logger.error(message, meta);
  }
}
