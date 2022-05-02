import Web3 from 'web3';
import HDWalletProvider from '@truffle/hdwallet-provider';
import { toChecksumAddress } from 'web3-utils';
import { RPC_URL, ACCOUNT_ADDRESS, HD_WALLET_MNEMONIC, PRIVATE_KEYS } from './environment';

interface GetWeb3Options {
    account?: string;
    mnemonic?: string;
    privateKeys?: string[];
}
export async function getWeb3(providerOrUrl: any, options?: GetWeb3Options) {
    const { mnemonic, privateKeys } = options ?? {};
    let account = options?.account;

    //Simple provider to connect to RPC
    //HDWallet does not support WS string out of the box so we have to wrap it as Web3 provider
    let providerRpc: any;
    if (typeof providerOrUrl === 'string') {
        const rpc = providerOrUrl;
        if (rpc.startsWith('http')) {
            providerRpc = new Web3.providers.HttpProvider(rpc);
        } else if (rpc.startsWith('ws')) {
            providerRpc = new Web3.providers.WebsocketProvider(rpc);
        } else {
            throw new Error(`Invalid rpc format ${rpc}! Must start with http|ws`);
        }
    } else {
        providerRpc = providerOrUrl;
    }

    let provider: any;
    if (mnemonic) {
        provider = new HDWalletProvider({
            mnemonic,
            providerOrUrl: providerRpc,
            addressIndex: 0,
        });
    } else if (privateKeys) {
        provider = new HDWalletProvider({
            privateKeys,
            providerOrUrl: providerRpc,
        });
    } else {
        //No keys, return default provider
        provider = providerRpc;
    }

    const web3 = new Web3(provider);
    if (!account) {
        if (!mnemonic && !privateKeys) {
            //Check unlocked accounts
            const accounts = await web3.eth.getAccounts(); //Unlocked accounts
            if (accounts.length > 0) account = accounts[0];
            else throw new Error('No account/mnemonic/privatekey specified and no unlocked accounts on node!');
        } else {
            //Check wallet accounts
            account = provider.getAddress(0);
            if (!account) throw new Error('mnemonic/privatekey could not unlock account!');
        }
    }
    account = toChecksumAddress(account);
    web3.eth.defaultAccount = account!;
    return { web3, provider, account };
}

export const getWeb3Default = async () => {
    if (!RPC_URL) throw new Error('RPC_URL undefined!');

    return getWeb3(RPC_URL, { account: ACCOUNT_ADDRESS, mnemonic: HD_WALLET_MNEMONIC, privateKeys: PRIVATE_KEYS });
};
