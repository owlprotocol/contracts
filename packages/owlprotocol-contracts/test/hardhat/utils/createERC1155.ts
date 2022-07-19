import { ethers } from 'hardhat';
import { FactoryERC1155 } from '../../../typechain';
import { TestingSigner, loadSignersSmart, loadForwarder } from '@owlprotocol/contract-helpers-opengsn/src';

// Creates + returns dummy ERC20 tokens for use in testing
export async function createERC1155(tokens = 1, signer?: TestingSigner) {
    // setup signer (uses gsn if needed)
    const signer1 = (await loadSignersSmart(ethers))[0];
    const localSigner = signer !== undefined ? signer : signer1;

    const mintAmount: number[] = []; // 0 => mints 10 x 100 to owner
    const FactoryERC1155 = await ethers.getContractFactory('FactoryERC1155');

    const contracts = [];
    for (let i = 0; i < tokens; i++) {
        contracts.push(FactoryERC1155.deploy(`Coin ${i}`, mintAmount) as Promise<FactoryERC1155>);
    }
    let deployedContracts = await Promise.all(contracts);
    // Assert all deployed
    await Promise.all(deployedContracts.map((c) => c.deployed()));

    // Set forwarder (if needed)
    const forwarder = await loadForwarder(ethers);
    // @ts-ignore
    await Promise.all(deployedContracts.map((c) => c.setTrustedForwarder(forwarder)));

    // Connect all (if needed)
    deployedContracts = await Promise.all(deployedContracts.map((contract) => contract.connect(localSigner)));

    return deployedContracts;
}

export default createERC1155;
