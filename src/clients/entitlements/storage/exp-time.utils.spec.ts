import { pickExpTimestamp } from './exp-time.utils';

describe('pickExpTimestamp', () => {
  it('returns max when all positive', () => {
    expect(pickExpTimestamp([10, 20, 30])).toBe(30);
  });

  it('returns max when all positive (unordered)', () => {
    expect(pickExpTimestamp([50, 10, 40])).toBe(50);
  });

  it('returns min when any negative', () => {
    expect(pickExpTimestamp([-1, 20, 30])).toBe(-1);
  });

  it('returns min when multiple negatives', () => {
    expect(pickExpTimestamp([-5, -1, 30])).toBe(-5);
  });

  it('handles single positive value', () => {
    expect(pickExpTimestamp([42])).toBe(42);
  });

  it('handles single negative value', () => {
    expect(pickExpTimestamp([-1])).toBe(-1);
  });

  it('handles all zeros', () => {
    expect(pickExpTimestamp([0, 0, 0])).toBe(0);
  });
});
