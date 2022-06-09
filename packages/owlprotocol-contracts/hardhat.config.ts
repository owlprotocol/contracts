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
            accounts: [process.env.PRIV_KEY],
        },
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
