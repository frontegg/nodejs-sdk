import { MaxAgeExceededException, MissingAcrException, MissingAmrException } from '../exceptions';
import { AMR_METHOD_VALUE, AMR_MFA_VALUE, STEP_UP_ACR_VALUE } from './constants';
import { StepupValidator } from './step-up.validator';

describe('StepUpValidator', () => {
  describe('validateStepUp', () => {
    it('should throw MissingAcrException if acr is not STEP_UP_ACR_VALUE', () => {
      const dto = { acr: 'fake-acr' };

      const act = () => StepupValidator.validateStepUp(dto, {});

      expect(act).toThrow(MissingAcrException);
    });

    it('should throw MissingAmrException if amr does not include AMR_MFA_VALUE', () => {
      const dto = { acr: STEP_UP_ACR_VALUE, amr: ['fake-amr'] };

      const act = () => StepupValidator.validateStepUp(dto, {});

      expect(act).toThrow(MissingAmrException);
    });

    it('should throw MissingAmrException if amr does not include AMR_METHOD_VALUE', () => {
      const dto = { acr: STEP_UP_ACR_VALUE, amr: [AMR_MFA_VALUE] };
      const stepUpOptions = {};

      const act = () => StepupValidator.validateStepUp(dto, stepUpOptions);

      expect(act).toThrow(MissingAmrException);
    });

    it('should throw MaxAgeExceededException if maxAge is exceeded', () => {
      const dto = {
        acr: STEP_UP_ACR_VALUE,
        amr: [AMR_MFA_VALUE, AMR_METHOD_VALUE[0]],
        auth_time: Date.now() / 1000 - 20,
      };
      const stepUpOptions = { maxAge: 5 };

      const act = () => StepupValidator.validateStepUp(dto, stepUpOptions);

      expect(act).toThrow(MaxAgeExceededException);
    });

    it('should throw MaxAgeExceededException if maxAge is specified but auth_time is missing', () => {
      const dto = {
        acr: STEP_UP_ACR_VALUE,
        amr: [AMR_MFA_VALUE, AMR_METHOD_VALUE[0]],
      };
      const stepUpOptions = { maxAge: 5 };

      const act = () => StepupValidator.validateStepUp(dto, stepUpOptions);

      expect(act).toThrow(MaxAgeExceededException);
    });

    it('should not throw if acr is STEP_UP_ACR_VALUE, amr includes AMR_MFA_VALUE and AMR_METHOD_VALUE and maxAge is not exceeded', () => {
      const dto = {
        acr: STEP_UP_ACR_VALUE,
        amr: [AMR_MFA_VALUE, AMR_METHOD_VALUE[0]],
        auth_time: Date.now() / 1000 - 20,
      };
      const stepUpOptions = { maxAge: 1000 };

      const act = () => StepupValidator.validateStepUp(dto, stepUpOptions);

      expect(act).not.toThrow();
    });
  });
});
