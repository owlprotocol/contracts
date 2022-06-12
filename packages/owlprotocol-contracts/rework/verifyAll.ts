import { exec } from 'child_process';
import { promisify } from 'util';
import dotenv from 'dotenv';
dotenv.config();

const contrAddr = '0xdBd2BaCe25998F67781aA087cEaF8f2a45B5f9B4';

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

            console.log(str + '\n');
        } catch (err) {
            console.log(err + '\n');
            continue;
        }
    }

    for (let i = 0; i < sourcifyExplorers.length; i++) {
        let str = '';
        try {
            const { stdout, stderr } = await promisify(exec)(`hh --network ${sourcifyExplorers[i]} sourcify`);
            if (stderr) console.log(stderr);
            str += stdout;

            console.log(str + '\n');
        } catch (err) {
            console.log(err + '\n');
            continue;
        }
    }
})();
