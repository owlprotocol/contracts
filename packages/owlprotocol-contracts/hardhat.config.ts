/**
 * @type import('hardhat/config').HardhatUserConfig
 */

import { HardhatUserConfig, HardhatNetworkAccountsUserConfig } from 'hardhat/types/config';
import '@typechain/hardhat';
import '@nomiclabs/hardhat-web3';
import '@nomiclabs/hardhat-ethers';
import '@nomiclabs/hardhat-waffle';
import '@nomiclabs/hardhat-etherscan';
import '@openzeppelin/hardhat-upgrades';
import 'hardhat-deploy';
import 'hardhat-deploy-ethers';

import dotenv from 'dotenv';
dotenv.config();
// TODO - auto doc generation

const config: HardhatUserConfig = {
    solidity: {
        version: '0.8.9',
        settings: {
            optimizer: {
                enabled: true,
                runs: 200,
            },
        },
    },
    namedAccounts: {
        deployer: 0,
        other: 1,
    },
    networks: {
        hardhat: {
            from: process.env.PRIV_KEY,
            chainId: 1337,
            //@ts-ignore
            accounts: [{ balance: '1000000000000000000', privateKey: process.env.PRIV_KEY }],
        },
        rinkeby: {
            from: process.env.PRIV_KEY,
            url: process.env.RINKEBY_URL || 'https://rinkeby.infura.io/v3/fee5821234524325b482f04d51c75878',
            //@ts-ignore will not be undefined
            accounts: [process.env.PRIV_KEY, process.env.OTHER_PRIV_KEY],
        },
        mainnet: {
            from: process.env.PRIV_KEY,
            url: process.env.MAINNET_URL || 'https://eth-mainnet.public.blastapi.io',
            //@ts-ignore will not be undefined
            accounts: [process.env.PRIV_KEY],
        },
        polygon: {
            from: process.env.PRIV_KEY,
            url: process.env.POLYGON_URL || 'https://matic-mainnet.chainstacklabs.com',
            //@ts-ignore will not be undefined
            accounts: [process.env.PRIV_KEY],
        },
        binance: {
            from: process.env.PRIV_KEY,
            url: process.env.BINANCE_URL || 'https://rpc-bsc.bnb48.club',
            //@ts-ignore will not be undefined
            accounts: [process.env.PRIV_KEY],
        },
        arbitrum: {
            from: process.env.PRIV_KEY,
            url: process.env.ARBITRUM_URL || 'https://arb1.arbitrum.io/rpc',
            //@ts-ignore will not be undefined
            accounts: [process.env.PRIV_KEY],
        },
        optimism: {
            from: process.env.PRIV_KEY,
            url: process.env.OPTIMISM_URL || 'https://mainnet.optimism.io',
            //@ts-ignore will not be undefined
            accounts: [process.env.PRIV_KEY],
        },
        avalanche: {
            from: process.env.PRIV_KEY,
            url: process.env.AVALANCHE_URL || 'https://ava-mainnet.public.blastapi.io/ext/bc/C/rpc',
            //@ts-ignore will not be undefined
            accounts: [process.env.PRIV_KEY],
        },
        fantom: {
            from: process.env.PRIV_KEY,
            url: process.env.FANTOM_URL || 'https://rpc.ankr.com/fantom',
            //@ts-ignore will not be undefined
            accounts: [process.env.PRIV_KEY],
        },
        harmony: {
            from: process.env.PRIV_KEY,
            url: process.env.HARMONY_URL || 'https://rpc.heavenswail.one',
            //@ts-ignore will not be undefined
            accounts: [process.env.PRIV_KEY],
        },
        aurora: {
            from: process.env.PRIV_KEY,
            url: process.env.AURORA_URL || 'https://mainnet.aurora.dev',
            //@ts-ignore will not be undefined
            accounts: [process.env.PRIV_KEY],
        },
        boba: {
            from: process.env.PRIV_KEY,
            url: process.env.BOBA_URL || 'https://lightning-replica.boba.network',
            //@ts-ignore will not be undefined
            accounts: [process.env.PRIV_KEY],
        },
        // huobi: {
        //     from: process.env.PRIV_KEY,
        //     url: process.env.HUOBI_URL || 'https://http-mainnet.hecochain.com',
        //     //@ts-ignore will not be undefined
        //     accounts: [process.env.PRIV_KEY],
        // },
        moonriver: {
            from: process.env.PRIV_KEY,
            url: process.env.MOONRIVER_URL || 'https://moonriver.public.blastapi.io',
            //@ts-ignore will not be undefined
            accounts: [process.env.PRIV_KEY],
        },
        moonbeam: {
            from: process.env.PRIV_KEY,
            url: process.env.MOONBEAM_URL || 'https://moonbeam.public.blastapi.io',
            //@ts-ignore will not be undefined
            accounts: [process.env.PRIV_KEY],
        },
        // theta: {
        //     from: process.env.PRIV_KEY,
        //     url: process.env.THETA_URL || 'https://eth-rpc-api.thetatoken.org/rpc',
        //     //@ts-ignore will not be undefined
        //     accounts: [process.env.PRIV_KEY],
        // },
    },
    //@ts-ignore
    typechain: {
        outDir: 'typechain', //default
        target: 'ethers-v5', //All options: ethers-v5, web3-v1, truffle-v5
    },
    etherscan: {
        apiKey: process.env.ETHERSCAN_API_KEY || '',
    },
};

export default config;
