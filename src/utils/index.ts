import Logger from '../components/logger';

export interface RetryOptions {
  numberOfTries: number;
  delayRangeMs: {
    min: number;
    max: number;
  };
}

export const retry = async (
  func: () => Promise<unknown> | unknown,
  { numberOfTries, delayRangeMs }: RetryOptions,
) => {
  try {
    return await func();
  } catch (error) {
    Logger.debug(`Failed, remaining tries: ${numberOfTries - 1}`);
    if (numberOfTries === 1) {
      throw error;
    }
    const delayTime =
      Math.floor(Math.random() * (delayRangeMs.max - delayRangeMs.min + 1)) + delayRangeMs.min;
    Logger.debug(`trying again in ${delayTime} ms`);
    await delay(delayTime);

    return retry(func, { numberOfTries: numberOfTries - 1, delayRangeMs });
  }
};

const delay = (ms: number): Promise<void> => new Promise((resolve) => setTimeout(resolve, ms));
