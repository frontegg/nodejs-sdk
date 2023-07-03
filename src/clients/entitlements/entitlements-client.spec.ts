import {EntitlementsClient} from "./entitlements-client";
import {FronteggContext} from "../../components/frontegg-context";
import { FronteggAuthenticator } from '../../authenticator';
import { HttpClient } from "../http";
import {mock, mockClear} from "jest-mock-extended";
import {VendorEntitlementsDto, VendorEntitlementsSnapshotOffsetDto} from "./types";
import {AxiosResponse} from "axios";
import { useFakeTimers } from "sinon";
import * as Sinon from "sinon";

const authenticatorMock = mock<FronteggAuthenticator>();
const httpMock = mock<HttpClient>();

jest.mock('../../authenticator');
jest.mock('../http');

describe(EntitlementsClient.name, () => {
    let entitlementsClient: EntitlementsClient;

    beforeEach(() => {
        // given
        jest.mocked(FronteggAuthenticator).mockReturnValue(authenticatorMock);
        authenticatorMock.init.mockResolvedValue(undefined);

        // given
        jest.mocked(HttpClient).mockReturnValue(httpMock);

        // given: default (empty) HTTP responses
        httpMock.get.calledWith('/api/vendor-entitlements').mockResolvedValue({
            data: {
                data: {
                    entitlements: [],
                    features: [],
                    featureBundles: []
                },
                snapshotOffset: 1234
            }
        } as unknown as AxiosResponse<VendorEntitlementsDto>);
        httpMock.get.calledWith('/api/vendor-entitlements-snapshot-offset').mockResolvedValue({
            data: {
                snapshotOffset: 1234
            }
        } as unknown as AxiosResponse<VendorEntitlementsSnapshotOffsetDto>);
    });

    describe('given the FronteggContext is initialized', () => {
        beforeAll(() => {
            FronteggContext.init({
                FRONTEGG_CLIENT_ID: 'foo-client',
                FRONTEGG_API_KEY: 'foo-api-key'
            });
        })

        it('when EntitlementsClient is initialized, then it uses client info from FronteggContext.', async () => {
            // when
            entitlementsClient = await EntitlementsClient.init();

            // then
            expect(authenticatorMock.init).toHaveBeenCalledWith('foo-client', 'foo-api-key');
        });

        describe('but the client info is passed as parameter', () => {
            it('when EntitlementsClient is initialized, then it uses client info from parameter, discarding FronteggContext.', async () => {
                // when
                entitlementsClient = await EntitlementsClient.init({
                    FRONTEGG_CLIENT_ID: 'overriden-client',
                    FRONTEGG_API_KEY: 'overriden-api-key'
                });

                // then
                expect(authenticatorMock.init).toHaveBeenCalledWith('overriden-client', 'overriden-api-key');
            });
        });
    });

    describe('given the EntitlementsClient is initialized', () => {
        let entitlementsClientInitialization: Promise<EntitlementsClient>;

        let timers: Sinon.SinonFakeTimers;
        beforeEach(async () => {
            timers = useFakeTimers()

            entitlementsClientInitialization = EntitlementsClient.init();
        });

        describe('when EntitlementsClient.init() resolves', () => {
            beforeEach(async () => {
                entitlementsClient = await entitlementsClientInitialization;
            })

            it('then FronteggAuthentication is initialized under the hood.', () => {
                // then
                expect(authenticatorMock.init).toHaveBeenCalled();
            });

            it('then latest vendor entitlements snapshot is downloaded from the server.', () => {
                // then
                expect(httpMock.get).toHaveBeenCalledWith('/api/vendor-entitlements');
            });
        });

        describe('and vendor entitlements snapshot changed on the server', () => {
            beforeEach(async () => {
                entitlementsClient = await entitlementsClientInitialization;

                httpMock.get.calledWith('/api/vendor-entitlements-snapshot-offset').mockResolvedValue({
                    data: {
                        snapshotOffset: 2345
                    }
                } as unknown as AxiosResponse<VendorEntitlementsSnapshotOffsetDto>);
                httpMock.get.calledWith('/api/vendor-entitlements').mockResolvedValue({
                    data: {
                        data: {
                            entitlements: [],
                            features: [],
                            featureBundles: []
                        },
                        snapshotOffset: 2345
                    }
                } as unknown as AxiosResponse<VendorEntitlementsDto>);

                mockClear(httpMock);
            });

            it('when 30 sec passes, new snapshot is fetched from the server.', async () => {
                // when
                await timers.tickAsync(30_000);

                // then
                expect(httpMock.get).toHaveBeenCalledWith('/api/vendor-entitlements-snapshot-offset');
                expect(httpMock.get).toHaveBeenCalledWith('/api/vendor-entitlements');

                // and
                expect(httpMock.get).toHaveBeenCalledTimes(2);
            });
        });

        describe('but vendor entitlements snapshot did not change on the server', () => {
            beforeEach(() => {
                mockClear(httpMock);
            });

            it('when 30 sec passes, snapshot is not fetched from the server.', async () => {
                // when
                await timers.tickAsync(30_000);

                // then
                expect(httpMock.get).toHaveBeenCalledWith('/api/vendor-entitlements-snapshot-offset');

                // and
                expect(httpMock.get).not.toHaveBeenCalledWith('/api/vendor-entitlements');

                // and
                expect(httpMock.get).toHaveBeenCalledTimes(1);
            });
        });

        afterEach(() => {
            timers.restore();
        });
    });

    afterEach(() => {
        entitlementsClient && entitlementsClient.destroy();
        mockClear(authenticatorMock);
        mockClear(httpMock);
    });
});