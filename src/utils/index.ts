import {Request} from "express";
import {AuthHeader, AuthHeaderType} from "../clients/identity/types";
import Logger from '../components/logger';

interface RetryOptions {
  numberOfTries: number;
  secondsDelayRange: {
    min: number;
    max: number;
  };
}

export const retry = async (
  func: () => Promise<unknown> | unknown,
  { numberOfTries, secondsDelayRange }: RetryOptions,
) => {
  try {
    return await func();
  } catch (error) {
    Logger.debug(`Failed, remaining tries: ${numberOfTries - 1}`);
    if (numberOfTries === 1) {
      throw error;
    }
    const delayTime =
      Math.floor(Math.random() * (secondsDelayRange.max - secondsDelayRange.min + 1)) + secondsDelayRange.min;
    Logger.debug(`trying again in ${delayTime} seconds`);
    await delay(delayTime * 1000);
    return retry(func, { numberOfTries: numberOfTries - 1, secondsDelayRange });
  }
};

const delay = (ms: number): Promise<void> => new Promise((resolve) => setTimeout(resolve, ms));

export function getAuthHeader(req: Request): AuthHeader | null {
    let token: string | undefined = req.header('authorization');
    if (token) {
        return {token: token.replace('Bearer ', ''), type: AuthHeaderType.JWT};
    }

    token = req.header('x-api-key');
    if (token) {
        return {token, type: AuthHeaderType.AccessToken};
    }

    return null;
}
