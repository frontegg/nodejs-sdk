export interface SetOptions {
  expiresInSeconds: number;
}

export interface ICacheManager<T> {
  set<V extends T>(key: string, data: V, options?: SetOptions): Promise<void>;
  get<V extends T>(key: string): Promise<V | null>;
  del(key: string[]): Promise<unknown>;

  /**
   * This method should return the instance of ICacheManager with the same cache connector below, but scoped set/get methods
   * to different type of values (defined by generic type S).
   *
   * If prefix is not given, the prefix of current instance should be used.
   */
  forScope<S>(prefix?: string): ICacheManager<S>;
}
