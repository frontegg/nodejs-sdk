import { StepupValidator } from '../clients/identity/step-up/step-up.validator';

describe('StepupValidator E2E', () => {
  it('should reject token without ACR claim', () => {
    expect(() =>
      StepupValidator.validateStepUp({
        amr: ['mfa', 'otp'],
        auth_time: Math.floor(Date.now() / 1000),
      }),
    ).toThrow();
  });

  it('should reject token without AMR claim', () => {
    expect(() =>
      StepupValidator.validateStepUp({
        acr: 'http://schemas.openid.net/pape/policies/2007/06/multi-factor',
        auth_time: Math.floor(Date.now() / 1000),
      }),
    ).toThrow();
  });

  it('should accept valid step-up claims', () => {
    expect(() =>
      StepupValidator.validateStepUp({
        acr: 'http://schemas.openid.net/pape/policies/2007/06/multi-factor',
        amr: ['mfa', 'otp'],
        auth_time: Math.floor(Date.now() / 1000),
      }),
    ).not.toThrow();
  });

  it('should reject when maxAge exceeded', () => {
    const oldAuthTime = Math.floor(Date.now() / 1000) - 3600;

    expect(() =>
      StepupValidator.validateStepUp(
        {
          acr: 'http://schemas.openid.net/pape/policies/2007/06/multi-factor',
          amr: ['mfa', 'otp'],
          auth_time: oldAuthTime,
        },
        { maxAge: 60 },
      ),
    ).toThrow();
  });

  it('should accept when maxAge not exceeded', () => {
    const recentAuthTime = Math.floor(Date.now() / 1000) - 30;

    expect(() =>
      StepupValidator.validateStepUp(
        {
          acr: 'http://schemas.openid.net/pape/policies/2007/06/multi-factor',
          amr: ['mfa', 'otp'],
          auth_time: recentAuthTime,
        },
        { maxAge: 60 },
      ),
    ).not.toThrow();
  });
});
