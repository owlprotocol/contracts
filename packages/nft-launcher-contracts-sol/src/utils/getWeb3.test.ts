import { assert } from 'chai';
import { getWeb3 } from './getWeb3';
import { configureGanacheMemo } from './configureGanache';
import { ACCOUNT_ADDRESS, HD_WALLET_MNEMONIC, PRIVATE_KEYS } from './environment';

describe('getWeb3', function () {
    const expectedAccount = ACCOUNT_ADDRESS;
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

    it('No account, use unlocked http', async () => {
        const { account } = await getWeb3(web3HttpUrl);
        assert.equal(account, expectedAccount, 'Unlocked account not match expected. Check ganache config.');
    });

    it('No account, use unlocked websocket', async () => {
        const { account } = await getWeb3(web3WebsocketUrl);
        assert.equal(account, expectedAccount, 'Unlocked account not match expected. Check ganache config.');
    });

    it('No account, privateKey', async () => {
        const { account } = await getWeb3(web3HttpUrl, { privateKeys: [privateKey] });
        assert.equal(account, expectedAccount, 'Private key account not match expected. Check web3 wallet.');
    });

    it('No account, mnemonic', async () => {
        const { account } = await getWeb3(web3HttpUrl, { mnemonic });
        assert.equal(account, expectedAccount, 'Private key account not match expected. Check web3 wallet.');
    });
});
