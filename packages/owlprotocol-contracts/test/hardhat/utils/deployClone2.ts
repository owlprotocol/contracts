import { BaseContract } from 'ethers';
import { ethers, web3 } from 'hardhat';
import { SignerWithAddress } from '@nomiclabs/hardhat-ethers/signers';
import { ERC1167Factory, ERC1167Factory__factory } from '../../../typechain';
import { FormatTypes } from '@ethersproject/abi';
import { JsonRpcSigner } from '@ethersproject/providers';

interface DeployClone2Input {
    implementation: BaseContract;
    initializerArgs: any[];
    cloneFactory?: ERC1167Factory;
    salt?: string;
    initSignature?: string;
    signer?: SignerWithAddress | JsonRpcSigner;
}

const DEFAULT_SALT = ethers.utils.formatBytes32String('1');

// For backwards compatibility
export async function deployCloneWrap(
    implementation: BaseContract,
    initializerArgs: any[],
    cloneFactory?: ERC1167Factory,
    salt?: string,
    initSignature = 'initialize',
    signer?: SignerWithAddress | JsonRpcSigner,
) {
    return await deployClone2({
        implementation,
        initializerArgs,
        cloneFactory,
        salt,
        initSignature,
        signer,
    });
}

export async function deployClone2(args: DeployClone2Input) {
    // Assign Config
    const { implementation, initializerArgs } = args;
    const salt = args.salt ? args.salt : DEFAULT_SALT;
    const initSignature = args.initSignature ? args.initSignature : 'initialize';

    // Factory Deploy
    const ERC1167FactoryFactory = args.cloneFactory
        ? args.cloneFactory
        : await (async () => {
            const factoryFactory = (await ethers.getContractFactory('ERC1167Factory')) as ERC1167Factory__factory;
            return await factoryFactory.deploy();
        })();

    // Setup Initializer Data
    const deploymentData = implementation.interface.encodeFunctionData(initSignature, initializerArgs);
    const address = await ERC1167FactoryFactory.predictDeterministicAddress(
        implementation.address,
        salt,
        deploymentData,
    );

    // Recipt data
    let receipt;
    if ((await web3.eth.getCode(address)) == '0x') {
        const tx = await ERC1167FactoryFactory.cloneDeterministic(implementation.address, salt, deploymentData);
        receipt = await tx.wait();
    }

    // Create Contract object for interaction
    let contract = (await ethers.getContractAt(
        implementation.interface.format(FormatTypes.full), // inherit ABI from impl
        address,
    )) as BaseContract;

    // Autoconnect with specified signer. This allows transparent GSN proxying
    if (args.signer !== undefined) contract = contract.connect(args.signer);

    return { address, receipt, contract };
}

export default deployClone2;
