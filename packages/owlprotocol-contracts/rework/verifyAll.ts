import config from '../hardhat.config';
import { exec } from 'child_process';
import { promisify } from 'util';
import { Console } from 'console';

const contrAddr = '0xDdE49F4aC07CdFa60B0559803EeE4A520c2611ED';

const etherscanExplorers = [
    'mainnet',
    'polygon',
    'binance',
    'arbitrum',
    'optimism',
    'avalanche',
    'fantom',
    'moonriver',
    'moonbeam',
];

const etherscanAPIKeys = [process.env.ETHERSCAN_API_KEY];

const sourcifyExplorers = ['polygon', 'binance', 'optimism', 'avalanche', 'aurora', 'boba', 'moonriver', 'moonbeam'];

(async () => {
    etherscanExplorers.forEach(async (key, i) => {
        if (key === 'hardhat' || key === 'rinkeby') return;
        let str = '';
        try {
            if (key in etherscanExplorers)
                str += (await promisify(exec)(`hh verify --network ${key} ${contrAddr}`)).stdout;
            str += (await promisify(exec)(`hh --network ${key} sourcify`)).stdout;
            console.log(str);
        } catch (err) {
            console.log(err);
            return;
        }
    });
})();
