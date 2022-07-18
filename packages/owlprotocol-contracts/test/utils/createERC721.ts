import { TestingSigner, loadSignersSmart, loadForwarder } from '@owlprotocol/contract-helpers-opengsn/src';
import { ethers } from 'hardhat';
import { FactoryERC721 } from '../../typechain';

// Creates + returns dummy ERC721 tokens for use in testing
export async function createERC721(tokens = 1, mintAmount = 10, signer?: TestingSigner) {
    // setup signer (uses gsn if needed)
    const signer1 = (await loadSignersSmart(ethers))[0];
    const localSigner = signer !== undefined ? signer : signer1;

    const FactoryERC721 = await ethers.getContractFactory('FactoryERC721');

    const contracts = [];
    for (let i = 0; i < tokens; i++) {
        // cast as FactoryERC721 because FactoryERC721 has exists and ERC721 doesn't
        contracts.push(FactoryERC721.deploy(`Collection ${i}`, `#${i}`) as Promise<FactoryERC721>);
    }
    let deployedContracts = await Promise.all(contracts);
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

    // Set forwarder (if needed)
    const forwarder = await loadForwarder(ethers);
    // @ts-ignore
    await Promise.all(deployedContracts.map((c) => c.setTrustedForwarder(forwarder)));

    // Connect all (if needed)
    deployedContracts = await Promise.all(deployedContracts.map((contract) => contract.connect(localSigner)));

    return deployedContracts;
}

export default createERC721;
