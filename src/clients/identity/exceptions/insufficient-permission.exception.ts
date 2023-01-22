import { StatusCodeError } from './status-code-error.exception';

export class InsufficientPermissionException extends StatusCodeError {
    constructor() {
        super(403, 'Failed to verify authentication');
    }
}
