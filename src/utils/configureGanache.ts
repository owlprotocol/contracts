import Web3 from 'web3';
import { HttpProvider, WebsocketProvider } from 'web3-core';
import ganache from 'ganache-core';
import memoize from 'fast-memoize';
import sleepForPort from './sleepForPort';

interface GanacheConfig {
    server?: boolean;
    fork?: string;
    networkId?: number;
    mnemonic?: string;
}
interface GanacheEnvironment {
    provider: ganache.Provider;
    server: ganache.Server | undefined;
    web3: Web3;
    web3HttpUrl: string | undefined;
    web3HttpProvider: HttpProvider | undefined;
    web3WebsocketUrl: string | undefined;
    web3WebsocketProvider: WebsocketProvider | undefined;
    accounts: string[];
}

export default async function configureGanache(config?: GanacheConfig): Promise<GanacheEnvironment> {
    let provider: ganache.Provider;
    let server: ganache.Server | undefined;
    let web3HttpUrl: string | undefined;
    let web3HttpProvider: HttpProvider | undefined;
    let web3WebsocketUrl: string | undefined;
    let web3WebsocketProvider: WebsocketProvider | undefined;
    const networkId = config?.networkId ?? 1337;
    const { fork, mnemonic } = config ?? {};
    if (config?.server) {
        //@ts-ignore
        server = ganache.server({ port: 0, fork, networkId, _chainIdRpc: networkId, _chainId: networkId, mnemonic });
        provider = server.provider;
        //Wait on port
        const port = await sleepForPort(server, 1000);
        console.debug(`Ganache running on port ${port}`);

        web3HttpUrl = `http://localhost:${port}`;
        web3HttpProvider = new Web3.providers.HttpProvider(web3HttpUrl);
        web3WebsocketUrl = `ws://localhost:${port}`;
        web3WebsocketProvider = new Web3.providers.WebsocketProvider(web3WebsocketUrl);
    } else {
        //@ts-ignore
        provider = ganache.provider({ fork, networkId, _chainIdRpc: networkId, _chainId: networkId });
    }

    //@ts-ignore
    const web3 = new Web3(provider);
    const accounts = await web3.eth.getAccounts();

    return {
        provider,
        server,
        web3,
        accounts,
        web3HttpUrl,
        web3HttpProvider,
        web3WebsocketUrl,
        web3WebsocketProvider,
    };
}

//Memoized, used for parrallel mocha tests
//JSON.stringify serialized
export const configureGanacheMemo = memoize(configureGanache);
