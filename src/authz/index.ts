import axios from 'axios';
import {FronteggAuthenticator} from "../authenticator";
import { config } from '../config';
import Logger from "../helpers/logger";

export class AuthzClient {

    private authenticator: FronteggAuthenticator | undefined;
    private readonly clientId: string;
    private strategy: IAuthzStrategy;

    constructor(options: IAuthzOptions) {
        this.clientId = options.clientId;
        this.authenticator = options.authenticator;
        switch(options.strategy) {
            case StrategyType.Opa:
                this.strategy = new OnPremiseStrategy(); break;
            case StrategyType.Frontegg:
                this.strategy = new SaaSStrategy(); break;
            default: this.strategy = new OnPremiseStrategy();
        }
    }

    public async hasScopes(user: object, scope: string[], assetId?: string): Promise<boolean> {
        return await this.strategy.hasScopes(this.clientId, user, scope, assetId);
    }

}

export enum StrategyType {
    Frontegg,
    Opa
}

export interface IAuthzOptions {
    strategy: StrategyType;
    clientId: string;
    authenticator?: FronteggAuthenticator;
}

interface IAuthzStrategy {
    hasScopes(clientId: string, user:object, scope: string[], assetId?: string): Promise<boolean>;
}

class OnPremiseStrategy implements IAuthzStrategy {

    public async hasScopes(clientId:string, user: object, scope: string[], assetId?: string): Promise<boolean> {
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

class SaaSStrategy implements IAuthzStrategy {

    public async hasScopes(clientId: string, user: object, scope: Array<string>, assetId?: string): Promise<boolean> {
        return true;
    }
}