import config from '../hardhat.config';
import { exec } from 'child_process';
import { promisify } from 'util';

(async () => {
    for (const key in config.networks) {
        const { stdout, stderr } = await promisify(exec)(`hh deploy --network ${key} --tags ERC1155`);
        if (stderr) console.error(stderr);
        console.log(stdout);
    }
})();
