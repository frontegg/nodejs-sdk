import { ensureSetInMap, ensureMapInMap, ensureArrayInMap } from './helper';

describe('ensureSetInMap', () => {
  it('creates new Set when key is missing', () => {
    const map = new Map<string, Set<number>>();

    const result = ensureSetInMap(map, 'key1');

    expect(result).toBeInstanceOf(Set);
    expect(result.size).toBe(0);
    expect(map.has('key1')).toBe(true);
  });

  it('returns existing Set when key is present', () => {
    const map = new Map<string, Set<number>>();
    const existing = new Set<number>([1, 2]);
    map.set('key1', existing);

    const result = ensureSetInMap(map, 'key1');

    expect(result).toBe(existing);
  });

  it('returns the same reference on second call', () => {
    const map = new Map<string, Set<string>>();

    const first = ensureSetInMap(map, 'k');
    first.add('a');
    const second = ensureSetInMap(map, 'k');

    expect(second).toBe(first);
    expect(second.has('a')).toBe(true);
  });
});

describe('ensureMapInMap', () => {
  it('creates new Map when key is missing', () => {
    const map = new Map<string, Map<string, number>>();

    const result = ensureMapInMap(map, 'key1');

    expect(result).toBeInstanceOf(Map);
    expect(result.size).toBe(0);
    expect(map.has('key1')).toBe(true);
  });

  it('returns existing Map when key is present', () => {
    const map = new Map<string, Map<string, number>>();
    const existing = new Map<string, number>([['a', 1]]);
    map.set('key1', existing);

    const result = ensureMapInMap(map, 'key1');

    expect(result).toBe(existing);
  });

  it('returns the same reference on second call', () => {
    const map = new Map<string, Map<string, number>>();

    const first = ensureMapInMap(map, 'k');
    first.set('x', 42);
    const second = ensureMapInMap(map, 'k');

    expect(second).toBe(first);
    expect(second.get('x')).toBe(42);
  });
});

describe('ensureArrayInMap', () => {
  it('creates new array when key is missing', () => {
    const map = new Map<string, number[]>();

    const result = ensureArrayInMap(map, 'key1');

    expect(result).toEqual([]);
    expect(map.has('key1')).toBe(true);
  });

  it('returns existing array when key is present', () => {
    const map = new Map<string, number[]>();
    const existing = [1, 2, 3];
    map.set('key1', existing);

    const result = ensureArrayInMap(map, 'key1');

    expect(result).toBe(existing);
  });

  it('returns the same reference on second call', () => {
    const map = new Map<string, string[]>();

    const first = ensureArrayInMap(map, 'k');
    first.push('hello');
    const second = ensureArrayInMap(map, 'k');

    expect(second).toBe(first);
    expect(second).toEqual(['hello']);
  });
});
