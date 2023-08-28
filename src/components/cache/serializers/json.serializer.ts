import { ICacheValueSerializer } from './types';

export class JsonSerializer implements ICacheValueSerializer {
  serialize<T>(data: T): string {
    return JSON.stringify(data);
  }

  deserialize<T>(raw: string): T {
    return JSON.parse(raw) as T;
  }
}
