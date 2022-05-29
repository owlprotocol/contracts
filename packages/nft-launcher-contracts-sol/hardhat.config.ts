/**
 * @type import('hardhat/config').HardhatUserConfig
 */

import { HardhatUserConfig } from 'hardhat/types/config';
import '@typechain/hardhat';
import '@nomiclabs/hardhat-web3';
import '@nomiclabs/hardhat-ethers';
import '@nomiclabs/hardhat-waffle';
import '@nomiclabs/hardhat-etherscan';
import '@openzeppelin/hardhat-upgrades';
import { utils } from 'ethers';
// TODO - auto doc generation

const config: HardhatUserConfig = {
    solidity: '0.8.9',
    networks: {
        // hardhat: {
        //     chainId: 1337,
        // },
        rinkeby: {
            url: process.env.ROPSTEN_URL || '',
            accounts: [process.env.PRIVATE_KEY || utils.hexZeroPad(utils.hexlify(0), 32)],
        },
    },
    //@ts-ignore
    typechain: {
        outDir: 'typechain', //default
        target: 'ethers-v5', //All options: ethers-v5, web3-v1, truffle-v5
    },
    etherscan: {
        apiKey: process.env.ETHERSCAN_API_KEY,
    },
};

export default config;
