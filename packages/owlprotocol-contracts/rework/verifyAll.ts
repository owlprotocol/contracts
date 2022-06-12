import config from '../hardhat.config';
import { exec } from 'child_process';
import { promisify } from 'util';
import { Console } from 'console';
import dotenv from 'dotenv';
dotenv.config();

const contrAddr = '0xDdE49F4aC07CdFa60B0559803EeE4A520c2611ED';

const etherscanExplorers = {
    mainnet: process.env.MAINNET_API_KEY,
    polygon: process.env.POLYGON_API_KEY,
    binance: process.env.BINANCE_API_KEY,
    arbitrum: process.env.ARBITRUM_API_KEY,
    optimism: process.env.OPTIMISM_API_KEY,
    avalanche: process.env.AVAX_API_KEY,
    fantom: process.env.FANTOM_API_KEY,
    aurora: process.env.AURORA_API_KEY,
    moonriver: process.env.MOONRIVER_API_KEY,
    moonbeam: process.env.MOONBEAM_API_KEY,
};

const sourcifyExplorers = ['polygon', 'binance', 'optimism', 'avalanche', 'aurora', 'boba', 'moonriver', 'moonbeam'];

(async () => {
    let i = 0;
    for (const key in etherscanExplorers) {
        if (key === 'hardhat' || key === 'rinkeby') continue;
        let str = '';
        try {
            const etherscanKey = etherscanExplorers[key as keyof typeof etherscanExplorers];
            console.log(key);
            const { stdout, stderr } = await promisify(exec)(`hh verify --network ${key} ${contrAddr}`, {
                env: { ETHERSCAN_API_KEY: etherscanKey },
            });
            if (stderr) console.log(stderr);
            str += stdout;

            str += (await promisify(exec)(`hh --network ${key} sourcify`)).stdout;
            console.log(str);
            console.log();
        } catch (err) {
            console.log(err);
            console.log();
            continue;
        }
        i += 1;
    }
})();
