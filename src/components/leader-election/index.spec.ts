import 'jest-extended';
import { LeaderElection } from './index';
import { mock, mockClear, mockReset } from 'jest-mock-extended';
import { ILockHandler } from './types';
import { SinonFakeTimers, useFakeTimers } from 'sinon';

describe(LeaderElection.name, () => {
  let cut: LeaderElection;
  let fakeTimer: SinonFakeTimers;

  const lockHandlerMock = mock<ILockHandler>();

  beforeEach(() => {
    cut = new LeaderElection(lockHandlerMock, 'foo', {
      key: 'my-lock-key',
      expireInMs: 5000,
      prolongLeadershipIntervalMs: 2000,
    });

    fakeTimer = useFakeTimers();
  });

  afterEach(() => {
    cut.close();

    //
    mockReset(lockHandlerMock);
    fakeTimer.restore();
  });

  describe('when the instance is not started manually', () => {
    it('then the resource locking tries are not performed.', async () => {
      // when
      await fakeTimer.tickAsync(10000);

      // then
      expect(lockHandlerMock.tryToLockLeaderResource).not.toHaveBeenCalled();
    });
  });

  describe('given the instance is started', () => {
    beforeEach(() => {
      cut.start();
    });

    it('when it closed, then the instance no longer tries to lock the resource.', async () => {
      // given: when started, it tries to lock the resource
      await fakeTimer.tickAsync(6000);
      expect(lockHandlerMock.tryToLockLeaderResource).toHaveBeenCalled();

      mockClear(lockHandlerMock);

      // when: stopped
      cut.close();

      // and: some time elapsed
      await fakeTimer.tickAsync(10000);

      // then: resource is no longer being tried to lock
      expect(lockHandlerMock.tryToLockLeaderResource).not.toHaveBeenCalled();
    });

    describe('and resource is already locked', () => {
      beforeEach(() => {
        lockHandlerMock.tryToLockLeaderResource.mockResolvedValue(false);
      });

      it('when the instance fails in locking the resource, then "leader" event is NOT emitted.', async () => {
        // given
        const onLeader = jest.fn();
        cut.on('leader', onLeader);

        // when
        await fakeTimer.tickAsync(6000);

        // then
        expect(onLeader).not.toHaveBeenCalled();
      });
    });

    describe('and resource is not locked', () => {
      beforeEach(() => {
        lockHandlerMock.tryToLockLeaderResource.mockResolvedValue(true);
      });

      it('when the instance succeeded in locking the resource, then "leader" event is emitted.', async () => {
        // given
        const onLeader = jest.fn();
        cut.on('leader', onLeader);

        // when
        await fakeTimer.tickAsync(6000);

        // then
        expect(onLeader).toHaveBeenCalled();
      });
    });
  });

  describe('given the instance is leader', () => {
    beforeEach(async () => {
      lockHandlerMock.tryToLockLeaderResource.mockResolvedValue(true);

      const isLeaderAlready = new Promise<void>((resolve) => {
        cut.once('leader', resolve);
      });

      cut.start();

      // wait for the leadership
      await fakeTimer.tickAsync(100);
      await isLeaderAlready;
    });

    it('then periodically it extends the resource lock.', async () => {
      // when: 2000 ms (configured extension time)
      await fakeTimer.tickAsync(2000);

      // then
      expect(lockHandlerMock.tryToMaintainTheLock).toHaveBeenCalled();
    });

    describe('but the resource lock cannot be extended', () => {
      beforeEach(() => {
        lockHandlerMock.tryToMaintainTheLock.mockResolvedValue(false);
      });

      it('when the periodic extension job executes, then the instance becomes the follower.', async () => {
        const isFollower = new Promise<void>((resolve) => {
          cut.once('follower', resolve);
        });

        // when
        await fakeTimer.tickAsync(5000);

        // then
        await expect(isFollower).toResolve();
      });
    });
  });

  describe('given the instance is follower', () => {
    beforeEach(async () => {
      lockHandlerMock.tryToLockLeaderResource.mockResolvedValue(false);

      const isFollowerAlready = new Promise<void>((resolve) => {
        cut.once('follower', resolve);
      });

      cut.start();

      // wait for the leadership
      await fakeTimer.tickAsync(6000);
      await isFollowerAlready;
    });

    describe('and the leader died and freed the resource', () => {
      beforeEach(() => {
        lockHandlerMock.tryToLockLeaderResource.mockResolvedValue(true);
      });

      it('when instance locked the resource, then it becomes the leader.', async () => {
        const isLeader = new Promise<void>((resolve) => {
          cut.once('leader', resolve);
        });

        // when
        await fakeTimer.tickAsync(6000);

        // then
        await expect(isLeader).toResolve();
      });
    });
  });
});
