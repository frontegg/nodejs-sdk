import { ILockHandler } from './types';

export class AlwaysLeaderLockHandler implements ILockHandler {
  async tryToMaintainTheLock(_key: string, _value: string, _expirationTimeMs: number): Promise<boolean> {
    return true;
  }

  async tryToLockLeaderResource(_key: string, _value: string, _expirationTimeMs: number): Promise<boolean> {
    return true;
  }
}
