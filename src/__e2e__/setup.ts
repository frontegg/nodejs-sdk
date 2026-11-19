export const E2E_BASE_URL = process.env.FRONTEGG_BASE_URL || '';
export const E2E_CLIENT_ID = process.env.FRONTEGG_CLIENT_ID || '';
export const E2E_API_KEY = process.env.FRONTEGG_API_KEY || '';

export function hasApiKey(): boolean {
  return [E2E_BASE_URL, E2E_CLIENT_ID, E2E_API_KEY].every((value) => value.trim().length > 0);
}

export function requireApiKey(): void {
  if (!hasApiKey()) {
    throw new Error('FRONTEGG_BASE_URL, FRONTEGG_CLIENT_ID and FRONTEGG_API_KEY are required for live e2e tests');
  }
}

export const describeLive = hasApiKey() ? describe : describe.skip;
