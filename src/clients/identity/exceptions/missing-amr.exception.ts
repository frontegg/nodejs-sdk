import { StatusCodeError } from './status-code-error.exception';

export class MissingAmrException extends StatusCodeError {
  constructor() {
    super(401, `Amr is missing`);
  }
}
