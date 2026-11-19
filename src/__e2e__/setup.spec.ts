describe('live suite credential gate', () => {
  const keys = ['FRONTEGG_BASE_URL', 'FRONTEGG_CLIENT_ID', 'FRONTEGG_API_KEY'];
  const original = keys.map((key) => process.env[key]);

  afterEach(() => {
    keys.forEach((key, index) => {
      if (original[index] === undefined) delete process.env[key];
      else process.env[key] = original[index];
    });
    jest.resetModules();
  });

  it.each([undefined, '', '  '])('skips live suites with absent or blank credentials: %s', async (missing) => {
    keys.forEach((key) => delete process.env[key]);
    if (missing !== undefined) process.env.FRONTEGG_API_KEY = missing;
    const setup = await import('./setup');
    expect(setup.E2E_CLIENT_ID).toBe('');
    expect(setup.E2E_API_KEY.trim()).toBe('');
    expect(setup.hasApiKey()).toBe(false);
    expect(setup.describeLive).toBe(describe.skip);
    expect(setup.requireApiKey).toThrow('required for live e2e tests');
  });

  it.each(keys)('requires %s even when other fields are present', async (missingKey) => {
    keys.forEach((key) => {
      process.env[key] = 'explicit-test-value';
    });
    delete process.env[missingKey];
    const setup = await import('./setup');
    expect(setup.hasApiKey()).toBe(false);
    expect(setup.describeLive).toBe(describe.skip);
  });

  it('enables live suites with all values explicitly supplied', async () => {
    keys.forEach((key) => {
      process.env[key] = 'explicit-test-value';
    });
    const setup = await import('./setup');
    expect(setup.hasApiKey()).toBe(true);
    expect(setup.describeLive).toBe(describe);
    expect(setup.requireApiKey).not.toThrow();
  });
});
