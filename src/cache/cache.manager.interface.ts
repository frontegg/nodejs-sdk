export interface SetOptions {
  expiresInSeconds: number;
}

export interface ICacheManager<T> {
  set(key: string, data: T, options?: SetOptions): Promise<void>;
  get(key: string): Promise<T | null>;
  del(key: string[]): Promise<unknown>;
}
