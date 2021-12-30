import axios from 'axios';
import {FronteggAuthenticator} from "../authenticator";
import { config } from '../config';
import Logger from "../helpers/logger";
import {StrategyType} from "./strategy-types";

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
                this.strategy = new OpaStrategy(); break;
            case StrategyType.Frontegg:
                this.strategy = new FronteggStrategy(); break;
            default: this.strategy = new OpaStrategy();
        }
    }

    public async hasScopes(user: object, scope: string[], assetId?: string): Promise<boolean> {
        const auth = this.clientId ? this.clientId : this.authenticator ? this.authenticator : "";
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

interface IAuthzStrategy {
    hasScopes(auth: string | FronteggAuthenticator, user:object, scope: string[], assetId?: string): Promise<boolean>;
}

class OpaStrategy implements IAuthzStrategy {

    public async hasScopes(clientId: string, user: object, scope: string[], assetId?: string): Promise<boolean> {
        try {
            Logger.info('going to verify scope');

            clientId = clientId.replace(/-/g, '');

            const input: {[k: string]: any} = {};
            input["scope"] = scope[0]; // TODO: once decided if we use array or not for scopes, change it accordingly
            if(assetId) {
                input["assetId"] = assetId;
            }
            Object.keys(user).forEach(
                e => {
                    input[`${e}`] = user[`${e}`];
                }
            );
            const opaPrefix = 'frontegg/opa';
            const { data } = await axios.post(`${config.urls.authzService}/v1/data/${opaPrefix}/${clientId}/allow`,
                { input }, {
                    headers: {
                        'Content-Type': 'application/json',
                        },
                responseType: 'json',
                });
            Logger.info('verified scope successfully');
            return data.result
        } catch (e) {
            Logger.error('failed to verify scope in authz service - ', e);
            throw e;
        }
    }
}

class FronteggStrategy implements IAuthzStrategy {

    public async hasScopes(clientId: FronteggAuthenticator, user: object, scope: Array<string>, assetId?: string): Promise<boolean> {
        return true;
    }
}