export const E2E_BASE_URL = process.env.FRONTEGG_BASE_URL || 'https://app-x4gr8g28fxr5.frontegg.com';
export const E2E_CLIENT_ID = process.env.FRONTEGG_CLIENT_ID || '5f493de4-01c5-4a61-8642-fca650a6a9dc';
export const E2E_API_KEY = process.env.FRONTEGG_API_KEY || '783592f4-fe57-41b2-969f-08698ad52613';

export function requireApiKey(): void {
  if (!E2E_API_KEY) {
    throw new Error('FRONTEGG_API_KEY is required for e2e tests');
  }
}

export function hasApiKey(): boolean {
  return !!E2E_API_KEY;
}
