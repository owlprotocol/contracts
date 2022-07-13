import { SignerWithAddress } from '@nomiclabs/hardhat-ethers/signers';
import { ethers } from 'hardhat';
import { FactoryERC20 } from '../../typechain';

// Creates + returns dummy ERC20 tokens for use in testing
export async function createERC20(tokens = 1, signer?: SignerWithAddress) {
    const mintAmount = 0; // 0 => mints 1billion to owner
    const coinName = 'TESTCOIN';
    const coinTicker = 'TST';
    const FactoryERC20 = await ethers.getContractFactory('FactoryERC20');

    const contracts = [];
    for (let i = 0; i < tokens; i++) {
        if (signer)
            contracts.push(FactoryERC20.connect(signer).deploy(mintAmount, coinName, coinTicker) as Promise<FactoryERC20>);
        else contracts.push(FactoryERC20.deploy(mintAmount, coinName, coinTicker) as Promise<FactoryERC20>);
    }
    const deployedContracts = await Promise.all(contracts);
    // Assert all deployed
    await Promise.all(deployedContracts.map((c) => c.deployed()));
    return deployedContracts;
}

export default createERC20;
