import { AuthorizationJWTResolver } from './authorization-token-resolver';
import { AuthHeaderType, tokenTypes, IEntityWithRoles, IUser } from '../types';
import { StepupValidator } from '../step-up/';
import { InvalidTokenTypeException } from '../exceptions';
import * as jsonwebtoken from 'jsonwebtoken';

jest.mock('jsonwebtoken');
jest.mock('../step-up/');

describe('AuthorizationJWTResolver', () => {
  let resolver: AuthorizationJWTResolver;
  const mockVerify = jsonwebtoken.verify as jest.Mock;

  const fakePublicKey = 'fake-public-key';
  const fakeToken = 'fake-token';

  const fakeEntity: IEntityWithRoles = {
    sub: 'user-123',
    tenantId: 'tenant-123',
    type: tokenTypes.UserToken,
    roles: ['admin'],
    permissions: ['read'],
  };

  beforeEach(() => {
    resolver = new AuthorizationJWTResolver();
    jest.clearAllMocks();
  });

  describe('shouldHandle', () => {
    it('should return true for AuthHeaderType.JWT', () => {
      expect(resolver.shouldHandle(AuthHeaderType.JWT)).toBe(true);
    });

    it('should return false for AuthHeaderType.AccessToken', () => {
      expect(resolver.shouldHandle(AuthHeaderType.AccessToken)).toBe(false);
    });
  });

  describe('validateToken', () => {
    beforeEach(() => {
      mockVerify.mockImplementation((_token, _key, _opts, callback) => {
        callback(null, fakeEntity);
      });
    });

    it('should call jsonwebtoken.verify with the token and public key', async () => {
      await resolver.validateToken(fakeToken, fakePublicKey);

      expect(mockVerify).toHaveBeenCalledWith(
        fakeToken,
        fakePublicKey,
        { algorithms: ['RS256'] },
        expect.any(Function),
      );
    });

    it('should return the entity on successful verification', async () => {
      const result = await resolver.validateToken(fakeToken, fakePublicKey);
      expect(result).toEqual(fakeEntity);
    });

    it('should call StepupValidator.validateStepUp when options.stepUp is true', async () => {
      await resolver.validateToken(fakeToken, fakePublicKey, { stepUp: true });

      expect(StepupValidator.validateStepUp).toHaveBeenCalledWith(fakeEntity, {});
    });

    it('should call StepupValidator.validateStepUp with stepUp options when provided as object', async () => {
      const stepUpOptions = { maxAge: 300 };
      await resolver.validateToken(fakeToken, fakePublicKey, { stepUp: stepUpOptions });

      expect(StepupValidator.validateStepUp).toHaveBeenCalledWith(fakeEntity, stepUpOptions);
    });

    it('should not call StepupValidator.validateStepUp when stepUp is not set', async () => {
      await resolver.validateToken(fakeToken, fakePublicKey);

      expect(StepupValidator.validateStepUp).not.toHaveBeenCalled();
    });

    it('should throw InvalidTokenTypeException when token type is not allowed', async () => {
      const invalidEntity = {
        ...fakeEntity,
        type: tokenTypes.TenantAccessToken,
      };
      mockVerify.mockImplementation((_token, _key, _opts, callback) => {
        callback(null, invalidEntity);
      });

      try {
        await resolver.validateToken(fakeToken, fakePublicKey);
        fail('Expected InvalidTokenTypeException to be thrown');
      } catch (e) {
        expect(e).toBeInstanceOf(InvalidTokenTypeException);
      }
    });

    it('should throw FailedToAuthenticateException when verify fails', async () => {
      mockVerify.mockImplementation((_token, _key, _opts, callback) => {
        callback(new Error('invalid signature'), null);
      });

      try {
        await resolver.validateToken(fakeToken, fakePublicKey);
        fail('Expected error to be thrown');
      } catch (e) {
        expect(e).toBeDefined();
      }
    });
  });
});
