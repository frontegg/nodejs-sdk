import { STEP_UP_ACR_VALUE, AMR_METHOD_VALUE, AMR_MFA_VALUE } from './constants';
import { IValidateStepupTokenOptions, ValidateStepupFields } from './types';
import { MaxAgeExceededException, MissingAcrException, MissingAmrException } from '../exceptions';
import Logger from '../../../components/logger';

export class StepupValidator {
  public static validateStepUp(dto: ValidateStepupFields, stepUpOptions: IValidateStepupTokenOptions = {}): void {
    const { acr, amr } = dto;
    const { maxAge } = stepUpOptions;

    const isACRValid = acr === STEP_UP_ACR_VALUE;

    if (!isACRValid) {
      Logger.info('Invalid ACR', { acr: acr });
      throw new MissingAcrException(STEP_UP_ACR_VALUE);
    }

    const isAMRIncludesMFA = amr?.includes(AMR_MFA_VALUE);
    const isAMRIncludesMethod = AMR_METHOD_VALUE.find((method) => amr?.includes(method));

    if (!(isAMRIncludesMFA && isAMRIncludesMethod)) {
      Logger.info('Invalid AMR', { amr: amr });
      throw new MissingAmrException();
    }

    if (maxAge) {
      const diff = Date.now() / 1000 - (dto.auth_time ?? 0);
      if (diff > maxAge) {
        Logger.info('Max age exceeded', { maxAge: maxAge, authTime: dto.auth_time });
        throw new MaxAgeExceededException();
      }
    }
  }
}
