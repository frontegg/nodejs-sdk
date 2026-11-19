// Transport objects can retain credentials in bodies, URLs, stacks and raw sockets.
// Summarize errors rather than serializing their arbitrary properties/toJSON methods.
export function sanitize(value: any, seen = new WeakSet<object>()): any {
  if (typeof value === 'function') return '[Function]';
  if (!value || typeof value !== 'object') return value;
  if (seen.has(value)) return '[Circular]';
  seen.add(value);
  if (value instanceof Error || value.isAxiosError === true) {
    return {
      name: value.isAxiosError === true ? 'AxiosError' : 'Error',
      code: /^E[A-Z_]+$/.test(value.code) ? value.code : undefined,
      status: typeof value.response?.status === 'number' ? value.response.status : undefined,
      method: /^(get|post|put|patch|delete|head|options)$/i.test(value.config?.method)
        ? value.config.method
        : undefined,
    };
  }
  if (Array.isArray(value)) return value.map((item) => sanitize(item, seen));
  const result = Object.create(null);
  for (const key of Object.keys(value)) {
    const normalized = key.replace(/[-_]/g, '').toLowerCase();
    result[key] =
      /authorization|cookie|token|secret|password|apikey|credential/.test(normalized) ||
      ['data', 'body', 'payload', 'request', 'url', 'baseurl', 'code', 'state'].includes(normalized)
        ? '[REDACTED]'
        : sanitize(value[key], seen);
  }
  return result;
}
