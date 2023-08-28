export interface ICacheValueSerializer {
  serialize<T>(data: T): string;
  deserialize<T>(raw: string): T;
}
