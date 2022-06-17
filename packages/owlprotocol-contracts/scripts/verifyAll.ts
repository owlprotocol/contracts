import { exec } from 'child_process';
import { promisify } from 'util';
import dotenv from 'dotenv';
dotenv.config();

const contrAddrs = [
    '0x9375400526B841C045BF40C799ABB8e6fAcA4148',
    '0xacDC0755137Bd4B1b148802a927CEA137e08B45b',
    '0xaAC1f37122143C918e533e5B516517b81A88F962',
    '0x37B6fcd5a2715590dB7F77Fe58a9ba578BE31198',
];

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
    // for (const key in etherscanExplorers) {
    //     let str = '';
    //     try {
    //         const etherscanKey = etherscanExplorers[key as keyof typeof etherscanExplorers];
    //         console.log(key);
    //         for (let i = 0; i < contrAddrs.length; i++) {
    //             console.log(contrAddrs[i]);
    //             try {
    //                 const { stdout, stderr } = await promisify(exec)(`hh verify --network ${key} ${contrAddrs[i]}`, {
    //                     env: { ETHERSCAN_API_KEY: etherscanKey },
    //                 });
    //                 if (stderr) console.log(stderr);
    //                 str += stdout;

    //                 console.log(str + '\n');
    //             } catch (err) {
    //                 console.log(err + '\n');
    //                 continue;
    //             }
    //         }
    //     } catch (err) {
    //         console.log(err + '\n');
    //         continue;
    //     }
    // }

    for (let i = 0; i < sourcifyExplorers.length; i++) {
        let str = '';
        try {
            console.log(sourcifyExplorers[i]);
            const { stdout, stderr } = await promisify(exec)(`hh --network ${sourcifyExplorers[i]} sourcify`);
            // if (stderr) console.log(stderr);
            str += stdout;

            console.log(str + '\n');
        } catch (err) {
            console.log(err + '\n');
            continue;
        }
    }
})();
