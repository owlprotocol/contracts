import { BaseContract, Contract } from 'ethers';
import { ethers, web3 } from 'hardhat';
import { ERC1167Factory, ERC1167Factory__factory } from '../../../typechain';

export async function predictDeployClone(
    implementation: BaseContract,
    initializerArgs: any[],
    cloneFactory?: ERC1167Factory,
    salt?: string,
) {
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

    return deploymentAddress;
}

export default predictDeployClone;
