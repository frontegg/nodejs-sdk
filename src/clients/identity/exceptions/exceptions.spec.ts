import { StatusCodeError } from './status-code-error.exception';
import { FailedToAuthenticateException } from './failed-to-authenticate.exception';
import { InsufficientPermissionException } from './insufficient-permission.exception';
import { InsufficientRoleException } from './insufficient-role.exception';
import { InvalidTokenTypeException } from './invalid-token-type.exception';
import { MaxAgeExceededException } from './max-age-exceeded.exception';
import { MissingAcrException } from './missing-acr.exception';
import { MissingAmrException } from './missing-amr.exception';

describe('exceptions', () => {
  describe('FailedToAuthenticateException', () => {
    it('should create with statusCode 401 and correct message', () => {
      const exception = new FailedToAuthenticateException();
      expect(exception.statusCode).toEqual(401);
      expect(exception.message).toEqual('Failed to verify authentication');
    });

    it('should be instanceof StatusCodeError', () => {
      const exception = new FailedToAuthenticateException();
      expect(exception).toBeInstanceOf(StatusCodeError);
    });
  });

  describe('InsufficientPermissionException', () => {
    it('should create with statusCode 403 and correct message', () => {
      const exception = new InsufficientPermissionException();
      expect(exception.statusCode).toEqual(403);
      expect(exception.message).toEqual('Failed to verify authentication');
    });

    it('should be instanceof StatusCodeError', () => {
      const exception = new InsufficientPermissionException();
      expect(exception).toBeInstanceOf(StatusCodeError);
    });
  });

  describe('InsufficientRoleException', () => {
    it('should create with statusCode 403 and correct message', () => {
      const exception = new InsufficientRoleException();
      expect(exception.statusCode).toEqual(403);
      expect(exception.message).toEqual('Insufficient role');
    });

    it('should be instanceof StatusCodeError', () => {
      const exception = new InsufficientRoleException();
      expect(exception).toBeInstanceOf(StatusCodeError);
    });
  });

  describe('InvalidTokenTypeException', () => {
    it('should create with statusCode 400 and correct message', () => {
      const exception = new InvalidTokenTypeException();
      expect(exception.statusCode).toEqual(400);
      expect(exception.message).toEqual('Invalid token type');
    });

    it('should be instanceof StatusCodeError', () => {
      const exception = new InvalidTokenTypeException();
      expect(exception).toBeInstanceOf(StatusCodeError);
    });
  });

  describe('MaxAgeExceededException', () => {
    it('should create with statusCode 401 and correct message', () => {
      const exception = new MaxAgeExceededException();
      expect(exception.statusCode).toEqual(401);
      expect(exception.message).toEqual('Max age exceeded');
    });

    it('should be instanceof StatusCodeError', () => {
      const exception = new MaxAgeExceededException();
      expect(exception).toBeInstanceOf(StatusCodeError);
    });
  });

  describe('MissingAcrException', () => {
    it('should create with statusCode 401 and message including ACR value', () => {
      const acrValue = 'http://schemas.openid.net/pape/policies/2007/06/multi-factor';
      const exception = new MissingAcrException(acrValue);
      expect(exception.statusCode).toEqual(401);
      expect(exception.message).toEqual(`Missing ACR: ${acrValue}`);
    });

    it('should include custom ACR value in message', () => {
      const exception = new MissingAcrException('custom-acr');
      expect(exception.message).toEqual('Missing ACR: custom-acr');
    });

    it('should be instanceof StatusCodeError', () => {
      const exception = new MissingAcrException('test');
      expect(exception).toBeInstanceOf(StatusCodeError);
    });
  });

  describe('MissingAmrException', () => {
    it('should create with statusCode 401 and correct message', () => {
      const exception = new MissingAmrException();
      expect(exception.statusCode).toEqual(401);
      expect(exception.message).toEqual('AMR is missing');
    });

    it('should be instanceof StatusCodeError', () => {
      const exception = new MissingAmrException();
      expect(exception).toBeInstanceOf(StatusCodeError);
    });
  });
});
