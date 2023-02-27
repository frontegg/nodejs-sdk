import { StatusCodeError } from './status-code-error.exception';

export class InvalidTokenTypeException extends StatusCodeError {
  constructor() {
    super(400, 'Invalid token type');
  }
}
