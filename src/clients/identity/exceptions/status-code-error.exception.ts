export class StatusCodeError {
  constructor(public readonly statusCode: number, public readonly message: string) {}
}
