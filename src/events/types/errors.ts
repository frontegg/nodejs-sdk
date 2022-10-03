export class NoDataException extends Error {
  constructor() {
    super();
    this.name = NoDataException.name;
    this.message = 'Event data with title and description is required';
  }
}

export class NoEventKeyException extends Error {
  constructor() {
    super();
    this.name = NoEventKeyException.name;
    this.message = 'Event key is required';
  }
}
