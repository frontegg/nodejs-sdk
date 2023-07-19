export abstract class PrefixedManager {

  protected constructor(protected readonly prefix: string = '') {
  }

  protected withPrefix(key: string): string {
    return this.prefix + key;
  }
}