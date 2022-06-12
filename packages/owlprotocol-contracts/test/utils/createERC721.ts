import { ethers } from 'hardhat';
import { ERC721 } from '../../typechain';

// Creates + returns dummy ERC721 tokens for use in testing
export async function createERC721(tokens = 1, mintAmount = 10) {
    const FactoryERC721 = await ethers.getContractFactory('FactoryERC721');

    const contracts = [];
    for (let i = 0; i < tokens; i++) {
        contracts.push(FactoryERC721.deploy(`Collection ${i}`, `#${i}`) as Promise<ERC721>);
    }
    const deployedContracts: ERC721[] = await Promise.all(contracts);
    // Make sure all deployed
    await Promise.all(deployedContracts.map((c) => c.deployed()));

    if (mintAmount) {
        const mints = [];
        for (let i = 0; i < tokens; i++) {
            //@ts-ignore
            mints.push(deployedContracts[i].mintTokens(mintAmount));
        }
        // Mint `mintAmount` nfts to each owner
        await Promise.all(mints);
    }

    return deployedContracts;
}

export default createERC721;
