import { StatusCodeError } from './status-code-error.exception';

export class InsufficientRoleException extends StatusCodeError {
    constructor() {
        super(403, 'Insufficient role');
    }
}
