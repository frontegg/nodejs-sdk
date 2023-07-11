export function pickExpTimestamp(values: number[]): number {
  const minValue = Math.min(...values);
  if (minValue < 0) return minValue;

  return Math.max(...values);
}
