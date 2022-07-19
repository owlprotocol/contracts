import { ethers } from 'hardhat';
import { FactoryERC20 } from '../../../typechain';
import { loadSignersSmart, TestingSigner, loadForwarder } from '@owlprotocol/contract-helpers-opengsn/src';

// Creates + returns dummy ERC20 tokens for use in testing
export async function createERC20(tokens = 1, signer?: TestingSigner) {
    // setup signer (uses gsn if needed)
    const signer1 = (await loadSignersSmart(ethers))[0];
    const localSigner = signer !== undefined ? signer : signer1;

    const mintAmount = 0; // 0 => mints 1billion to owner
    const coinName = 'TESTCOIN';
    const coinTicker = 'TST';
    const FactoryERC20 = await ethers.getContractFactory('FactoryERC20');

    const contracts = [];
    for (let i = 0; i < tokens; i++) {
        contracts.push(FactoryERC20.deploy(mintAmount, coinName, coinTicker) as Promise<FactoryERC20>);
    }
    let deployedContracts = await Promise.all(contracts);
    // Assert all deployed
    await Promise.all(deployedContracts.map((c) => c.deployed()));

    // Set forwarder (if needed)
    const forwarder = await loadForwarder(ethers);
    // @ts-ignore
    await Promise.all(deployedContracts.map((c) => c.setTrustedForwarder(forwarder)));

    // Connect all (if needed)
    deployedContracts = deployedContracts.map((contract) => contract.connect(localSigner));

    return deployedContracts;
}

export default createERC20;
