import { ethers } from 'hardhat';
import { ERC20 } from '../../typechain';

// Creates + returns dummy ERC20 tokens for use in testing
export async function createERC20(tokens = 1) {
    const mintAmount = 0; // 0 => mints 1billion to owner
    const coinName = 'TESTCOIN';
    const coinTicker = 'TST';
    const FactoryERC20 = await ethers.getContractFactory('FactoryERC20');

    const contracts = [];
    for (let i = 0; i < tokens; i++) {
        contracts.push(FactoryERC20.deploy(mintAmount, coinName, coinTicker) as Promise<ERC20>);
    }
    const deployedContracts = await Promise.all(contracts);
    // Assert all deployed
    await Promise.all(deployedContracts.map((c) => c.deployed()));
    return deployedContracts;
}

export default createERC20;
