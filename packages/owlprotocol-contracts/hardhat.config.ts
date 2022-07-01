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
import 'solidity-docgen';

import { ethers } from 'ethers';

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
            accounts: [
                //@ts-ignore
                { balance: '1000000000000000000', privateKey: process.env.PRIV_KEY },
                //@ts-ignore
                { balance: '1000000000000000000', privateKey: process.env.PROXY_PRIV_KEY },
                { balance: '1000000000000000000', privateKey: ethers.utils.hexZeroPad(ethers.utils.hexlify(1), 32) },
                { balance: '1000000000000000000', privateKey: ethers.utils.hexZeroPad(ethers.utils.hexlify(2), 32) },
                { balance: '1000000000000000000', privateKey: ethers.utils.hexZeroPad(ethers.utils.hexlify(3), 32) },
            ],
        },

        rinkeby: {
            from: process.env.PRIV_KEY,
            url: process.env.RINKEBY_URL || 'https://rinkeby.infura.io/v3/fee5821234524325b482f04d51c75878',
            //@ts-ignore will not be undefined
            accounts: [process.env.PRIV_KEY, process.env.PROXY_PRIV_KEY],
        },
        mainnet: {
            from: process.env.PRIV_KEY,
            url: process.env.MAINNET_URL || 'https://eth-mainnet.public.blastapi.io',
            //@ts-ignore will not be undefined
            accounts: [process.env.PRIV_KEY, process.env.PROXY_PRIV_KEY],
        },
        polygon: {
            from: process.env.PRIV_KEY,
            url: process.env.POLYGON_URL || 'https://matic-mainnet.chainstacklabs.com',
            //@ts-ignore will not be undefined
            accounts: [process.env.PRIV_KEY, process.env.PROXY_PRIV_KEY],
        },
        binance: {
            from: process.env.PRIV_KEY,
            url: process.env.BINANCE_URL || 'https://rpc-bsc.bnb48.club',
            //@ts-ignore will not be undefined
            accounts: [process.env.PRIV_KEY, process.env.PROXY_PRIV_KEY],
        },
        arbitrum: {
            from: process.env.PRIV_KEY,
            url: process.env.ARBITRUM_URL || 'https://arb1.arbitrum.io/rpc',
            //@ts-ignore will not be undefined
            accounts: [process.env.PRIV_KEY, process.env.PROXY_PRIV_KEY],
        },
        optimism: {
            from: process.env.PRIV_KEY,
            url: process.env.OPTIMISM_URL || 'https://mainnet.optimism.io',
            //@ts-ignore will not be undefined
            accounts: [process.env.PRIV_KEY, process.env.PROXY_PRIV_KEY],
        },
        avalanche: {
            from: process.env.PRIV_KEY,
            url: process.env.AVALANCHE_URL || 'https://ava-mainnet.public.blastapi.io/ext/bc/C/rpc',
            //@ts-ignore will not be undefined
            accounts: [process.env.PRIV_KEY, process.env.PROXY_PRIV_KEY],
        },
        fantom: {
            from: process.env.PRIV_KEY,
            url: process.env.FANTOM_URL || 'https://rpc.ankr.com/fantom',
            //@ts-ignore will not be undefined
            accounts: [process.env.PRIV_KEY, process.env.PROXY_PRIV_KEY],
        },
        harmony: {
            from: process.env.PRIV_KEY,
            url: process.env.HARMONY_URL || 'https://rpc.heavenswail.one',
            //@ts-ignore will not be undefined
            accounts: [process.env.PRIV_KEY, process.env.PROXY_PRIV_KEY],
        },
        aurora: {
            from: process.env.PRIV_KEY,
            url: process.env.AURORA_URL || 'https://mainnet.aurora.dev',
            //@ts-ignore will not be undefined
            accounts: [process.env.PRIV_KEY, process.env.PROXY_PRIV_KEY],
        },
        boba: {
            from: process.env.PRIV_KEY,
            url: process.env.BOBA_URL || 'https://lightning-replica.boba.network',
            //@ts-ignore will not be undefined
            accounts: [process.env.PRIV_KEY, process.env.PROXY_PRIV_KEY],
        },
        // huobi: {
        //     from: process.env.PRIV_KEY,
        //     url: process.env.HUOBI_URL || 'https://http-mainnet.hecochain.com',
        //     //@ts-ignore will not be undefined
        //     accounts: [process.env.PRIV_KEY, process.env.PROXY_PRIV_KEY],
        // },
        moonriver: {
            from: process.env.PRIV_KEY,
            url: process.env.MOONRIVER_URL || 'https://moonriver.public.blastapi.io',
            //@ts-ignore will not be undefined
            accounts: [process.env.PRIV_KEY, process.env.PROXY_PRIV_KEY],
        },
        moonbeam: {
            from: process.env.PRIV_KEY,
            url: process.env.MOONBEAM_URL || 'https://moonbeam.public.blastapi.io',
            //@ts-ignore will not be undefined
            accounts: [process.env.PRIV_KEY, process.env.PROXY_PRIV_KEY],
        },
        // theta: {
        //     from: process.env.PRIV_KEY,
        //     url: process.env.THETA_URL || 'https://eth-rpc-api.thetatoken.org/rpc',
        //     //@ts-ignore will not be undefined
        //     accounts: [process.env.PRIV_KEY, process.env.PROXY_PRIV_KEY],
        // },
        owl: {
            from: process.env.PRIV_KEY,
            url: process.env.OWL_URL || 'https://blockchain.istio.owlprotocol.xyz/poa/rpc',
            //@ts-ignore will not be undefined
            accounts: [process.env.PRIV_KEY, process.env.PROXY_PRIV_KEY],
        },
    },
    //@ts-ignore
    typechain: {
        outDir: 'typechain', //default
        target: 'ethers-v5', //All options: ethers-v5, web3-v1, truffle-v5
    },
    etherscan: {
        apiKey: {
            mainnet: process.env.MAINNET_API_KEY,
            polygon: process.env.POLYGON_API_KEY,
            bsc: process.env.BINANCE_API_KEY,
            arbitrumOne: process.env.ARBITRUM_API_KEY,
            optimisticEthereum: process.env.OPTIMISM_API_KEY,
            avalanche: process.env.AVAX_API_KEY,
            opera: process.env.FANTOM_API_KEY,
            aurora: process.env.AURORA_API_KEY,
            moonriver: process.env.MOONRIVER_API_KEY,
            moonbeam: process.env.MOONBEAM_API_KEY,
        },
        //@ts-ignore
        customChains: [
            {
                network: 'polygon',
                chainId: 137,
                urls: {
                    apiURL: 'https://api.polygonscan.com/',
                    browserURL: 'https://polygonscan.com',
                },
            },
            {
                network: 'binance',
                chainId: 56,
                urls: {
                    apiURL: 'https://api.bscscan.com/',
                    browserURL: 'https://bscscan.com/',
                },
            },
            {
                network: 'arbitrum',
                chainId: 42161,
                urls: {
                    apiURL: 'https://api.arbiscan.com/',
                    browserURL: 'https://arbiscan.io/',
                },
            },
            {
                network: 'optimism',
                chainId: 10,
                urls: {
                    apiURL: 'https://api-optimistic.etherscan.io',
                    browserURL: 'https://optimistic.etherscan.io/',
                },
            },
            {
                network: 'avalanche',
                chainId: 43114,
                urls: {
                    apiURL: 'https://api.snowtrace.io',
                    browserURL: 'https://snowtrace.io/',
                },
            },
            {
                network: 'fantom',
                chainId: 250,
                urls: {
                    apiURL: 'https://api.ftmscan.com',
                    browserURL: 'https://ftmscan.com/',
                },
            },
            {
                network: 'aurora',
                chainId: 13113161554,
                urls: {
                    apiURL: 'https://explorer.mainnet.aurora.dev/api',
                    browserURL: 'https://aurorascan.dev/',
                },
            },
            {
                network: 'moonriver',
                chainId: 1285,
                urls: {
                    apiURL: 'https://blockscout.moonriver.moonbeam.network/api',
                    browserURL: 'https://moonriver.moonscan.io/',
                },
            },
            {
                network: 'moonbeam',
                chainId: 1284,
                urls: {
                    apiURL: 'https://api-moonbeam.moonscan.io',
                    browserURL: 'https://moonscan.io/',
                },
            },
        ],
    },
    docgen: {
        outputDir: '../owlprotocol-contracts-docs/docs/contract-docs',
        pages: 'items',
        templates: '../owlprotocol-contracts-docs/docs-templates/',
    },
};

export default config;
