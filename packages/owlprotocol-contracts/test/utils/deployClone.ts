import { BaseContract, Contract } from 'ethers';
import { ethers, web3 } from 'hardhat';
import { SignerWithAddress } from '@nomiclabs/hardhat-ethers/signers';
import { ERC1167Factory, ERC1167Factory__factory } from '../../typechain';

export async function deployClone(
    implementation: BaseContract,
    initializerArgs: any[],
    cloneFactory?: ERC1167Factory,
    salt?: string,
    initSignature = 'initialize',
    signer?: SignerWithAddress,
) {
    let ERC1167Factory;
    if (cloneFactory) ERC1167Factory = cloneFactory;
    else {
        const factoryFactory = (await ethers.getContractFactory('ERC1167Factory')) as ERC1167Factory__factory;
        if (signer === undefined) ERC1167Factory = await factoryFactory.deploy();
        else ERC1167Factory = await factoryFactory.connect(signer).deploy();
    }

    let saltString = ethers.utils.formatBytes32String('1');
    if (salt) saltString = salt;

    const deploymentData = implementation.interface.encodeFunctionData(initSignature, initializerArgs);

    const deploymentAddress = await ERC1167Factory.predictDeterministicAddress(
        implementation.address,
        saltString,
        deploymentData,
    );
    let receipt;
    if ((await web3.eth.getCode(deploymentAddress)) == '0x') {
        let tx;
        if (signer === undefined)
            tx = await ERC1167Factory.cloneDeterministic(implementation.address, saltString, deploymentData);
        else
            tx = await ERC1167Factory.connect(signer).cloneDeterministic(
                implementation.address,
                saltString,
                deploymentData,
            );
        receipt = await tx.wait();
    }

    return { address: deploymentAddress, receipt };
}

export default deployClone;
