export function ensureSetInMap<K, T>(map: Map<K, Set<T>>, mapKey: K): Set<T> {
  let set = map.get(mapKey);
  if (!set) {
    set = new Set();
    map.set(mapKey, set);
  }

  return set;
}

export function ensureMapInMap<K, T extends Map<any, any>>(map: Map<K, T>, mapKey: K): T {
  let nestedMap = map.get(mapKey);
  if (!nestedMap) {
    nestedMap = new Map() as T;
    map.set(mapKey, nestedMap);
  }

  return nestedMap;
}

export function ensureArrayInMap<K, T>(map: Map<K, T[]>, mapKey: K): T[] {
  let array = map.get(mapKey);
  if (!array) {
    array = [];
    map.set(mapKey, array);
  }

  return array;
}
