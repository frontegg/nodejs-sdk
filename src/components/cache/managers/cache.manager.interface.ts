export interface SetOptions {
  expiresInSeconds: number;
}

export interface ICacheManager<T> {
  set<V extends T>(key: string, data: V, options?: SetOptions): Promise<void>;
  get<V extends T>(key: string): Promise<V | null>;
  del(key: string[]): Promise<unknown>;
  hashmap(key: string): ICacheManagerMap;
  collection(key: string): ICacheManagerCollection;

  /**
   * This method should return the instance of ICacheManager with the same cache connector below, but scoped set/get
   * methods to different type of values (defined by generic type S).
   *
   * If prefix is not given, the prefix of current instance should be used.
   */
  forScope<S>(prefix?: string): ICacheManager<S>;
}

export interface ICacheManagerMap {
  set<T>(field: string, data: T): Promise<void>;
  get<T>(field: string): Promise<T | null>;
  del(field: string): Promise<void>;
}

export interface ICacheManagerCollection {
  set<T>(value: T): Promise<void>;
  has<T>(value: T): Promise<boolean>;
  getAll<T>(): Promise<T[]>;
}
