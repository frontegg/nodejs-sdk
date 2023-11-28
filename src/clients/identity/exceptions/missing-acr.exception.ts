import { StatusCodeError } from './status-code-error.exception';

export class MissingAcrException extends StatusCodeError {
  constructor(acr: string) {
    super(401, `Missing acr: ${acr}`);
  }
}
