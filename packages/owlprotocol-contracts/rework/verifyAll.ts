import config from '../hardhat.config';
import { exec } from 'child_process';
import { promisify } from 'util';
import { Console } from 'console';
import dotenv from 'dotenv';
dotenv.config();

const contrAddr = '0xDdE49F4aC07CdFa60B0559803EeE4A520c2611ED';

const etherscanExplorers = [
    'mainnet',
    'polygon',
    'binance',
    'arbitrum',
    'optimism',
    'avalanche',
    'fantom',
    'aurora',
    'moonriver',
    'moonbeam',
];

const etherscanAPIKeys = [
    process.env.MAINNET_API_KEY,
    process.env.POLYGON_API_KEY,
    process.env.BINANCE_API_KEY,
    process.env.ARBITRUM_API_KEY,
    process.env.OPTIMISM_API_KEY,
    process.env.AVAX_API_KEY,
    process.env.FANTOM_API_KEY,
    process.env.AURORA_API_KEY,
    process.env.MOONRIVER_API_KEY,
    process.env.MOONBEAM_API_KEY,
];

console.log(etherscanAPIKeys);
console.log(etherscanExplorers);
console.log('----------');

const sourcifyExplorers = ['polygon', 'binance', 'optimism', 'avalanche', 'aurora', 'boba', 'moonriver', 'moonbeam'];

(async () => {
    etherscanExplorers.forEach(async (key, i) => {
        if (key === 'hardhat' || key === 'rinkeby') return;
        let str = '';
        try {
            const etherscanKey = etherscanAPIKeys[i];
            str += (
                await promisify(exec)(`hh verify --network ${key} ${contrAddr}`, {
                    env: { ETHERSCAN_API_KEY: etherscanKey },
                })
            ).stdout;

            // str += (await promisify(exec)(`hh --network ${key} sourcify`)).stdout;
            console.log(str);
        } catch (err) {
            return;
        }
    });
})();
