/**
 * @type import('hardhat/config').HardhatUserConfig
 */

import configObj from './configObj';
import { HardhatUserConfig } from 'hardhat/types/config';
import '@typechain/hardhat';
import '@nomiclabs/hardhat-truffle5';
import '@nomiclabs/hardhat-web3';
import '@nomiclabs/hardhat-ethers';

const config: HardhatUserConfig = { ...configObj };

export default config;
