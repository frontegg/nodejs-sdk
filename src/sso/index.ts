import Axios from "axios";
import { FronteggAuthenticator } from '../authenticator';
import { config } from '../config';
import Logger from '../helpers/logger';

export interface ISamlResponse {
    RelayState: string;
    SAMLResponse: string;
}

export class SsoClient {
    private authenticator: FronteggAuthenticator = new FronteggAuthenticator();

    public async init(clientId: string, accessKey: string) {
        Logger.info('going to authenticate');
        await this.authenticator.init(clientId, accessKey);
        Logger.info('Authenticated with frontegg');
    }

    /**
     * @param payload - email or tenantId
     * @param scopes -  list of scopes in case of Open ID Connect based SSO request (optional)
     */
    public async prelogin(payload: string, scopes?: string[]): Promise<string> {
        const preloginRes = await Axios.post(
            `${config.urls.teamService}/resources/sso/v1/prelogin`,
            { payload, scopes },
            {
                headers: {
                    'x-access-token': this.authenticator.accessToken,
                },
                maxRedirects: 0,
                validateStatus: (status) => status >= 200 && status < 400,
            },
        );
        return preloginRes.headers.location;
    }

    public async postlogin(samlResponse: ISamlResponse): Promise<any> {
        const authnResponse = await Axios.post(
            `${config.urls.teamService}/resources/sso/v1/postlogin`,
            samlResponse,
            {
                headers: {
                    'x-access-token': this.authenticator.accessToken,
                },
                maxRedirects: 0,
                validateStatus: (status) => status >= 200 && status < 400,
            },
        );
        return authnResponse.data;
    }

}
