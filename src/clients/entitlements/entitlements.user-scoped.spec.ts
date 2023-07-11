import {
  EntitlementsUserScoped,
  IsEntitledToFeatureInput,
  IsEntitledToPermissionInput,
} from './entitlements.user-scoped';
import { IEntity, TEntityWithRoles, tokenTypes } from '../identity/types';
import { mock, mockReset } from 'jest-mock-extended';
import { EntitlementsCache, NO_EXPIRE } from './storage/types';
import { EntitlementReasons } from './types';
import SpyInstance = jest.SpyInstance;

describe(EntitlementsUserScoped.name, () => {
  const cacheMock = mock<EntitlementsCache>();
  let cut: EntitlementsUserScoped<IEntity>;

  afterEach(() => {
    mockReset(cacheMock);
  });

  describe('given the authenticated user with permission "foo" granted', () => {
    const entity: TEntityWithRoles<IEntity> = {
      type: tokenTypes.UserApiToken,
      permissions: ['foo'],
      roles: ['irrelevant'],
      id: 'the-user-id',
      tenantId: 'the-tenant-id',
      sub: 'irrelevant',
    };

    beforeEach(() => {
      cut = new EntitlementsUserScoped<IEntity>(entity, cacheMock);
    });

    describe('and feature "bar" is linked to permission "foo"', () => {
      beforeEach(() => {
        cacheMock.getLinkedFeatures.calledWith('foo').mockResolvedValue(new Set(['bar']));
      });

      describe('and unlimited entitlement to feature "bar" is given to the user', () => {
        beforeEach(() => {
          cacheMock.getEntitlementExpirationTime
            .calledWith('bar', 'the-tenant-id', 'the-user-id')
            .mockResolvedValue(NO_EXPIRE);
          cacheMock.getEntitlementExpirationTime.calledWith('bar', 'the-tenant-id', undefined).mockResolvedValue(undefined);
        });

        it('when .isEntitledTo({ featureKey: "bar"}) is called, then the access is granted.', async () => {
          await expect(cut.isEntitledTo({ featureKey: 'bar' })).resolves.toEqual({
            result: true,
          });
        });

        it('when .isEntitledTo({ permissionKey: "foo" }) is called, then the access is granted.', async () => {
          await expect(cut.isEntitledTo({ permissionKey: 'foo' })).resolves.toEqual({
            result: true,
          });
        });
      });

      describe('and limited entitlement to feature "bar" is given to the user', () => {
        const expiryTime = 1688937961000;

        beforeEach(() => {
          cacheMock.getEntitlementExpirationTime
            .calledWith('bar', 'the-tenant-id', 'the-user-id')
            .mockResolvedValue(expiryTime);
          cacheMock.getEntitlementExpirationTime.calledWith('bar', 'the-tenant-id', undefined).mockResolvedValue(undefined);
        });

        afterEach(() => {
          jest.useRealTimers();
        });

        describe.each([
          { input: { featureKey: 'bar' } as IsEntitledToFeatureInput },
          { input: { permissionKey: 'foo' } as IsEntitledToPermissionInput },
        ])('when isEntitledTo($input) is executed', ({ input }) => {
          it('before the expiry time, then access is granted.', async () => {
            // given
            jest.useFakeTimers({ now: expiryTime - 1000 });

            // when & then
            await expect(cut.isEntitledTo(input as IsEntitledToFeatureInput)).resolves.toEqual({
              result: true,
            });
          });

          it('after the expiry time, then access is rejected and reason is BUNDLE_EXPIRED.', async () => {
            // given
            jest.useFakeTimers({ now: expiryTime + 1000 });

            // when & then
            await expect(cut.isEntitledTo(input as IsEntitledToFeatureInput)).resolves.toEqual({
              result: false,
              reason: EntitlementReasons.BUNDLE_EXPIRED,
            });
          });
        });
      });
    });

    describe('and no feature is linked to permissions "foo" and "bar"', () => {
      beforeEach(() => {
        cacheMock.getLinkedFeatures.calledWith('foo').mockResolvedValue(new Set());
        cacheMock.getLinkedFeatures.calledWith('bar').mockResolvedValue(new Set());
      });

      it('when isEntitledTo({ permission: "foo" }) is called, then access is granted.', async () => {
        await expect(cut.isEntitledTo({ permissionKey: 'foo' })).resolves.toEqual({ result: true });
      });

      it('when isEntitledTo({ permission: "bar" }) is called, then access is rejected with reason MISSING_PERMISSION.', async () => {
        await expect(cut.isEntitledTo({ permissionKey: 'bar' })).resolves.toEqual({
          result: false,
          reason: EntitlementReasons.MISSING_PERMISSION,
        });
      });
    });
  });

  describe('when isEntitledTo(...) is called', () => {
    let isEntitledToPermissionSpy: SpyInstance;
    let isEntitledToFeatureSpy: SpyInstance;

    beforeEach(() => {
      cut = new EntitlementsUserScoped<IEntity>(
        {
          id: 'irrelevant',
          tenantId: 'irrelevant',
          type: tokenTypes.TenantAccessToken,
          roles: [],
          permissions: [],
          sub: 'irrelevant',
        },
        cacheMock,
      );

      // given
      isEntitledToFeatureSpy = jest.spyOn(cut, 'isEntitledToFeature');
      isEntitledToPermissionSpy = jest.spyOn(cut, 'isEntitledToPermission');

      isEntitledToPermissionSpy.mockResolvedValue({ result: true });
      isEntitledToFeatureSpy.mockResolvedValue({ result: true });
    });

    it('with permissionKey only, then the answer is generated by isEntitledToPermission method.', async () => {
      // when
      await cut.isEntitledTo({ permissionKey: 'foo' });

      // then
      expect(isEntitledToPermissionSpy).toHaveBeenCalledWith('foo');
      expect(isEntitledToFeatureSpy).not.toHaveBeenCalled();
    });

    it('with featureKey only, then the answer is generated by isEntitledToFeature method.', async () => {
      // when
      await cut.isEntitledTo({ featureKey: 'foo' });

      // then
      expect(isEntitledToPermissionSpy).not.toHaveBeenCalled();
      expect(isEntitledToFeatureSpy).toHaveBeenCalledWith('foo');
    });

    it('with both featureKey and permissionKey, then the Error is thrown.', async () => {
      // when & then
      await expect(
        cut.isEntitledTo({ featureKey: 'foo', permissionKey: 'bar' } as unknown as IsEntitledToFeatureInput),
      ).rejects.toThrowError();

      // and
      expect(isEntitledToPermissionSpy).not.toHaveBeenCalled();
      expect(isEntitledToFeatureSpy).not.toHaveBeenCalled();
    });

    it('with neither featureKey, nor permissionKey, then the Error is thrown.', async () => {
      // when & then
      await expect(
        cut.isEntitledTo({
          /* it's empty */
        } as unknown as IsEntitledToFeatureInput),
      ).rejects.toThrowError();

      // and
      expect(isEntitledToPermissionSpy).not.toHaveBeenCalled();
      expect(isEntitledToFeatureSpy).not.toHaveBeenCalled();
    });
  });
});
