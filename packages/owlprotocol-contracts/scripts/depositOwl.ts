import { ethers } from 'hardhat';
import { CrafterTransfer } from '../typechain';
import { tokenIds } from '../constants';

(async () => {
    const [orig, proxy] = await ethers.getSigners();
    const cryptoOwlCrafter = (await ethers.getContractAt(
        'CrafterTransfer',
        '0x093fa98ba3333ddb0b64226A9748521e146949A3',
    )) as CrafterTransfer;
    const craftTx = await cryptoOwlCrafter.connect(proxy).deposit(1, [['3204700997211091208000111002190000000000']]);
    const txReceipt = await craftTx.wait();

    console.log(txReceipt.events);

    console.log(`CryptoOwl deposited by ${proxy.address} with ${txReceipt.gasUsed} gas`);
})();
