import { ethers } from 'hardhat';
import { ERC721Owl } from '../typechain';
import { tokenIds } from '../constants';

(async () => {
    const [orig, proxy] = await ethers.getSigners();
    const cryptoOwlContr = (await ethers.getContractAt(
        'ERC721Owl',
        '0xB82DE49BC1375BFDEDF13a1B0fB1d140ca09C55E',
    )) as ERC721Owl;
    for (let i = 0; i < tokenIds.length; i++) {
        const tokenId = tokenIds[i];
        const mintTx = await cryptoOwlContr.connect(proxy).mint(proxy.address, tokenId);
        const txReceipt = await mintTx.wait();

        console.log(`CryptoOwl ${tokenId} minted to ${proxy.address} with ${txReceipt.gasUsed} gas`);
    }
})();
