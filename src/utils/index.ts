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
