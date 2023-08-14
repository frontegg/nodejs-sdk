import {
  ILeadershipElectionGivenOptions,
  ILeadershipElectionOptions,
  ILockHandler,
  LeaderElectionEvents,
} from './types';
import { TypedEmitter } from 'tiny-typed-emitter';

export class LeaderElection extends TypedEmitter<LeaderElectionEvents> {
  private isLeader?: boolean;
  private options: ILeadershipElectionOptions;

  private electionExtensionTimeout?: NodeJS.Timeout;
  private electionTimeout?: NodeJS.Timeout;

  private withDefaults(givenOptions: ILeadershipElectionGivenOptions): ILeadershipElectionOptions {
    return {
      expireInMs: 60_000,
      ...givenOptions,
    };
  }

  constructor(
    private readonly lockHandler: ILockHandler,
    readonly identifier: string,
    options: ILeadershipElectionGivenOptions,
  ) {
    super();

    // compose options
    this.options = this.withDefaults(options);
  }

  start(): void {
    // immediately start the "fight" for leadership
    this.scheduleLeadershipTry(0);
  }

  close(): void {
    // cleanup leadership extension (if started)
    this.electionExtensionTimeout && clearTimeout(this.electionExtensionTimeout);

    // cleanup follower trials of becoming the leader (if started)
    this.electionTimeout && clearTimeout(this.electionTimeout);
  }

  private async becomeLeader(): Promise<void> {
    this.isLeader = true;

    // cleanup follower trials of becoming the leader
    this.electionTimeout && clearTimeout(this.electionTimeout);

    // start the periodic leadership extension process
    this.scheduleLeadershipExtension();

    // notify everyone we're leader
    this.emit('leader');
  }

  private becomeFollower(): void {
    // do nothing for now
    this.isLeader = false;

    // cleanup leadership extension (if started)
    this.electionExtensionTimeout && clearTimeout(this.electionExtensionTimeout);

    // notify everyone we're follower
    this.emit('follower');
  }

  private async tryToBecomeLeader(): Promise<void> {
    const becameLeader = await this.lockHandler.tryToLockLeaderResource(
      this.options.key,
      this.identifier,
      this.options.expireInMs,
    );

    this.scheduleLeadershipTry();

    if (becameLeader === this.isLeader) {
      return;
    }

    if (becameLeader) {
      await this.becomeLeader();
    } else {
      await this.becomeFollower();
    }
  }

  private async extendLeadership(): Promise<void> {
    if (await this.lockHandler.tryToMaintainTheLock(this.options.key, this.identifier, this.options.expireInMs)) {
      this.scheduleLeadershipExtension();
    } else {
      await this.becomeFollower();
    }
  }

  private scheduleLeadershipExtension(): void {
    this.electionExtensionTimeout = setTimeout(
      () => this.extendLeadership(),
      this.options.prolongLeadershipIntervalMs || this.options.expireInMs / 2,
    );
  }

  private scheduleLeadershipTry(timeout = this.options.expireInMs) {
    this.electionTimeout = setTimeout(() => this.tryToBecomeLeader(), timeout);
  }
}
