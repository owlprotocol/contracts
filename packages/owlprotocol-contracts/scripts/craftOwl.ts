import { ethers } from 'hardhat';
import { CrafterTransfer } from '../typechain';
import { tokenIds } from '../constants';

(async () => {
    const [orig, proxy] = await ethers.getSigners();
    const cryptoOwlCrafter = (await ethers.getContractAt(
        'CrafterTransfer',
        '0x093fa98ba3333ddb0b64226A9748521e146949A3',
    )) as CrafterTransfer;
    const craftTx = await cryptoOwlCrafter.connect(proxy).craft(1, [[]]);
    const txReceipt = await craftTx.wait();

    console.log(txReceipt.events);

    console.log(`CryptoOwl crafted by ${proxy.address} with ${txReceipt.gasUsed} gas`);
})();
