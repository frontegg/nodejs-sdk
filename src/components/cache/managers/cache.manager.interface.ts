export interface SetOptions {
  expiresInSeconds: number;
}

type Primitive = bigint | boolean | null | number | string | undefined | object;

type JSONValue = Primitive | JSONObject | JSONArray;
export interface JSONObject {
  [k: string]: JSONValue;
}
type JSONArray = JSONValue[];

export type CacheValue = JSONValue;

export interface ICacheManager<T extends CacheValue> {
  set<V extends T>(key: string, data: V, options?: SetOptions): Promise<void>;
  get<V extends T>(key: string): Promise<V | null>;
  del(key: string[]): Promise<unknown>;
  map(key: string): ICacheManagerMap<T>;
  collection(key: string): ICacheManagerCollection<T>;
  close(): Promise<void>;

  /**
   * This method should return the instance of ICacheManager with the same cache connector below, but scoped set/get
   * methods to different type of values (defined by generic type S).
   *
   * If prefix is not given, the prefix of current instance should be used.
   */
  forScope<S extends CacheValue>(prefix?: string): ICacheManager<S>;
}

export interface ICacheManagerMap<Base> {
  set<T extends Base>(field: string, data: T): Promise<void>;
  get<T extends Base>(field: string): Promise<T | null>;
  del(field: string): Promise<void>;
}

export interface ICacheManagerCollection<Base> {
  set<T extends Base>(value: T): Promise<void>;
  has<T extends Base>(value: T): Promise<boolean>;
  getAll<T extends Base>(): Promise<Set<T>>;
}
