import { StatusCodeError } from './status-code-error.exception';

export class FailedToAuthenticateException extends StatusCodeError {
    constructor() {
        super(401, 'Failed to verify authentication');
    }
}
