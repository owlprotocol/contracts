import config from '../../hardhat.config';
import { exec } from 'child_process';
import { promisify } from 'util';

(async () => {
    for (const key in config.networks) {
        console.log('burning on', key, '...');
        if (key === 'hardhat' || key === 'rinkeby' || key === 'harmony') continue;
        const { stdout, stderr } = await promisify(exec)(`hh run --network ${key} scripts/utils/burn.ts`);
        if (stderr) console.error(stderr);
        console.log(stdout);
    }
})();
