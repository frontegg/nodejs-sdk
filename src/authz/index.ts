import { FronteggAuthenticator } from '../authenticator';
import { StrategyType } from './strategy-types';
import { FronteggStrategy, IAuthzStrategy, OpaStrategy } from './strategies';

export class AuthzClient {
  private readonly authenticator: FronteggAuthenticator | undefined;
  private readonly clientId: string | undefined;
  private strategy: IAuthzStrategy;

  constructor(options: IFronteggAuthzOptions | IOpaAuthzOptions) {
    if ('authenticator' in options) {
      this.authenticator = options.authenticator;
    } else if ('clientId' in options) {
      this.clientId = options.clientId;
    }

    switch (options.strategy) {
      case StrategyType.Opa:
        this.strategy = new OpaStrategy();
        break;
      case StrategyType.Frontegg:
        this.strategy = new FronteggStrategy();
        break;
      default:
        this.strategy = new OpaStrategy();
    }
  }

  public async hasScopes(user: object, scope: string[], assetId?: string): Promise<boolean> {
    const auth = this.clientId ? this.clientId : this.authenticator ? this.authenticator : '';
    return await this.strategy.hasScopes(auth, user, scope, assetId);
  }
}

export interface IFronteggAuthzOptions {
  authenticator: FronteggAuthenticator;
  strategy?: StrategyType.Frontegg;
}

export interface IOpaAuthzOptions {
  clientId: string;
  strategy?: StrategyType.Opa;
}
