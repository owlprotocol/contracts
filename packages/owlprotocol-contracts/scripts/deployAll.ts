import config from '../hardhat.config';
import { exec } from 'child_process';
import { promisify } from 'util';

(async () => {
    for (const key in config.networks) {
        console.log('deploying on', key, '...');
        if (key === 'hardhat' || key === 'rinkeby') continue;
        const { stdout, stderr } = await promisify(exec)(`hh deploy --network ${key} --tags Beacons`);
        if (stderr) console.error(stderr);
        console.log(stdout);
    }
})();
