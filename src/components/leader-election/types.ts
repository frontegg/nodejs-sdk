export interface ILockHandler {
  /**
   * This method is about to lock the `leadershipResourceKey` by writing its `instanceIdentifier` to it. The lock should
   * not be permanent, but limited to given `expirationTimeMs`. Then the lock can be kept (extended) by calling
   * `tryToMaintainTheLock` method.
   */
  tryToLockLeaderResource(
    leadershipResourceKey: string,
    instanceIdentifier: string,
    expirationTimeMs: number,
  ): Promise<boolean>;

  /**
   * This method is about to prolong the `leadershipResourceKey` time-to-live only, when the key contains value equal to
   * given `instanceIdentifier`. Each instance competing for a leadership role needs to have a unique identifier.
   *
   * This way we know, that only the leader process can prolong its leadership. If leader dies, for any reason, no other
   * process can extend its leadership.
   */
  tryToMaintainTheLock(
    leadershipResourceKey: string,
    instanceIdentifier: string,
    expirationTimeMs: number,
  ): Promise<boolean>;
}

export interface ILeadershipElectionOptions {
  key: string;
  expireInMs: number;
  prolongLeadershipIntervalMs?: number;
}

export type ILeadershipElectionGivenOptions = Partial<ILeadershipElectionOptions> &
  Pick<ILeadershipElectionOptions, 'key'>;

export interface LeaderElectionEvents {
  leader: () => void;
  follower: () => void;
}
