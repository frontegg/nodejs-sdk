export interface SetOptions {
  expiresInSeconds: number;
}

export interface ICacheManager {
  set<T>(key: string, data: T, options?: SetOptions): Promise<void>;
  get<T>(key: string): Promise<T | null>;
  del(key: string[]): Promise<unknown>;
}
