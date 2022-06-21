import { ethers } from 'hardhat';
import { ERC1155Owl } from '../typechain';

(async () => {
    const [orig, proxy] = await ethers.getSigners();
    const cryptoOwlPartsContr = (await ethers.getContractAt(
        'ERC1155Owl',
        '0xb2AbAFfea68DA850CBc901D426CD287dc61bF1C3',
    )) as ERC1155Owl;

    const mintTx = await cryptoOwlPartsContr
        .connect(proxy)
        .mintBatch(proxy.address, [1, 1, 2, 3, 4, 5, 6], [104, 104, 104, 52, 52, 52, 104], '0x');
    const txReceipt = await mintTx.wait();

    console.log(`CryptoOwlParts set minted to ${proxy.address} with ${txReceipt.gasUsed} gas`);
})();
