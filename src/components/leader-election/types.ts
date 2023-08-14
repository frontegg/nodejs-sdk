export interface ILockHandler {
  tryToLockLeaderResource(key: string, value: string, expirationTimeMs: number): Promise<boolean>;
  tryToMaintainTheLock(key: string, value: string, expirationTimeMs: number): Promise<boolean>;
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
