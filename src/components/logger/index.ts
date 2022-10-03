import * as winston from 'winston';

const index = winston.createLogger({
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
    index.debug(message, meta);
  }

  public static debug(message: string, ...meta: any[]) {
    index.debug(message, meta);
  }

  public static info(message: string, ...meta: any[]) {
    index.info(message, meta);
  }

  public static warn(message: string, ...meta: any[]) {
    index.warn(message, meta);
  }

  public static error(message: string, ...meta: any[]) {
    index.error(message, meta);
  }
}
