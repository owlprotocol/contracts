import { getWeb3 } from './utils/getWeb3';
import { deploy, contracts } from './deploy';
import { HD_WALLET_MNEMONIC, PRIVATE_KEYS } from './utils/environment';
import { configureGanacheMemo } from './utils/configureGanache';
import setProvider from './utils/setProvider';

describe('deploy', function () {
    const privateKey = PRIVATE_KEYS![0];
    const mnemonic = HD_WALLET_MNEMONIC;

    let web3HttpUrl: string;
    let web3WebsocketUrl: string;

    before(async () => {
        const config = await configureGanacheMemo({
            server: true,
            mnemonic,
        });
        web3HttpUrl = config.web3HttpUrl!;
        web3WebsocketUrl = config.web3WebsocketUrl!;
    });

    describe('http://', () => {
        it('No account, use unlocked', async () => {
            const { provider, account } = await getWeb3(web3HttpUrl);
            setProvider(Object.values(contracts), provider, account);
            deploy();
        });

        it('No account, privateKey', async () => {
            const { provider, account } = await getWeb3(web3HttpUrl, { privateKeys: [privateKey] });
            setProvider(Object.values(contracts), provider, account);
            deploy();
        });

        it('No account, mnemonic', async () => {
            const { provider, account } = await getWeb3(web3HttpUrl, { mnemonic });
            setProvider(Object.values(contracts), provider, account);
            deploy();
        });
    });

    describe('ws://', () => {
        it('No account, use unlocked', async () => {
            const { provider, account } = await getWeb3(web3WebsocketUrl);
            setProvider(Object.values(contracts), provider, account);
            deploy();
        });

        it('No account, privateKey', async () => {
            const { provider, account } = await getWeb3(web3WebsocketUrl, { privateKeys: [privateKey] });
            setProvider(Object.values(contracts), provider, account);
            deploy();
        });

        it('No account, mnemonic', async () => {
            const { provider, account } = await getWeb3(web3WebsocketUrl, { mnemonic });
            setProvider(Object.values(contracts), provider, account);
            deploy();
        });
    });
});
