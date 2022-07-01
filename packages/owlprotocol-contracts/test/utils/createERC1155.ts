import { ethers } from 'hardhat';
import { SignerWithAddress } from '@nomiclabs/hardhat-ethers/signers';
import { ERC1155 } from '../../typechain';

// Creates + returns dummy ERC20 tokens for use in testing
export async function createERC1155(tokens = 1, signer?: SignerWithAddress) {
    const mintAmount: number[] = []; // 0 => mints 10 x 100 to owner
    const FactoryERC1155 = await ethers.getContractFactory('FactoryERC1155');

    const contracts = [];
    for (let i = 0; i < tokens; i++) {
        if (signer) contracts.push(FactoryERC1155.connect(signer).deploy(`Coin ${i}`, mintAmount) as Promise<ERC1155>);
        else contracts.push(FactoryERC1155.deploy(`Coin ${i}`, mintAmount) as Promise<ERC1155>);
    }
    const deployedContracts = await Promise.all(contracts);
    // Assert all deployed
    await Promise.all(deployedContracts.map((c) => c.deployed()));
    return deployedContracts;
}

export default createERC1155;
