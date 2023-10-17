export function ensureSetInMap<K, T>(map: Map<K, Set<T>>, mapKey: K): Set<T> {
  if (!map.has(mapKey)) {
    map.set(mapKey, new Set());
  }

  return map.get(mapKey)!;
}

export function ensureMapInMap<K, T extends Map<any, any>>(map: Map<K, T>, mapKey: K): T {
  if (!map.has(mapKey)) {
    map.set(mapKey, new Map() as T);
  }

  return map.get(mapKey)!;
}

export function ensureArrayInMap<K, T>(map: Map<K, T[]>, mapKey: K): T[] {
  if (!map.has(mapKey)) {
    map.set(mapKey, []);
  }

  return map.get(mapKey)!;
}
