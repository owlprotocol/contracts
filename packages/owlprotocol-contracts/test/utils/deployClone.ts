import { BaseContract, Contract } from 'ethers';
import { ethers, web3 } from 'hardhat';
import { ERC1167Factory, ERC1167Factory__factory } from '../../typechain';

export default async (
    implementation: BaseContract,
    initializerArgs: any[],
    cloneFactory?: ERC1167Factory,
    salt?: string,
): Promise<string> => {
    let ERC1167Factory;
    if (cloneFactory) ERC1167Factory = cloneFactory;
    else {
        const factoryFactory = (await ethers.getContractFactory('ERC1167Factory')) as ERC1167Factory__factory;
        ERC1167Factory = await factoryFactory.deploy();
    }
    let saltString = ethers.utils.formatBytes32String('1');
    if (salt) saltString = salt;

    const deploymentData = implementation.interface.encodeFunctionData('initialize', initializerArgs);

    const deploymentAddress = await ERC1167Factory.predictDeterministicAddress(
        implementation.address,
        saltString,
        deploymentData,
    );
    if ((await web3.eth.getCode(deploymentAddress)) == '0x') {
        const tx = await ERC1167Factory.cloneDeterministic(implementation.address, saltString, deploymentData);
        const receipt = await tx.wait();
        // console.log('receipt:', receipt.events);
    }

    return deploymentAddress;
};
