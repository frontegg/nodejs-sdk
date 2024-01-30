import { StatusCodeError } from './status-code-error.exception';

export class MaxAgeExceededException extends StatusCodeError {
  constructor() {
    super(401, 'Max age exceeded');
  }
}
