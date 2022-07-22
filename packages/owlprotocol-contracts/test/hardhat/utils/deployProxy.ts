import { BaseContract } from 'ethers';
import { ethers } from 'hardhat';
import { deployClone } from './deployClone';
import { predictDeployClone } from './predictDeployClone';
import {
    BeaconProxyInitializable,
    BeaconProxyInitializable__factory,
    UpgradeableBeaconInitializable,
    UpgradeableBeaconInitializable__factory,
} from '../../../typechain';
import { FormatTypes } from 'ethers/lib/utils';

// Used for testing beacon proxy initialization
// See test in MinterSimpleMerkle for example usage.
export default async function deployProxy(
    owner: string,
    implementation: BaseContract,
    deployArgs: any,
    initSignature = 'proxyInitialize',
) {
    if (!initSignature.includes('proxy')) throw 'proxyInitialze(...) signature must be called!';

    const beaconFactory = (await ethers.getContractFactory(
        'UpgradeableBeaconInitializable',
    )) as UpgradeableBeaconInitializable__factory;
    const beaconImpl = (await beaconFactory.deploy()) as UpgradeableBeaconInitializable;

    const beaconProxyFactory = (await ethers.getContractFactory(
        'BeaconProxyInitializable',
    )) as BeaconProxyInitializable__factory;
    const beaconProxyImpl = (await beaconProxyFactory.deploy()) as BeaconProxyInitializable;

    const { address: beaconAddr } = await deployClone(beaconImpl, [owner, implementation.address]);

    //@ts-ignore
    const data = implementation.interface.encodeFunctionData(initSignature, deployArgs);
    const beaconProxyAddr = await predictDeployClone(beaconProxyImpl, [owner, beaconAddr, data]);

    await deployClone(beaconProxyImpl, [owner, beaconAddr, data]);
    const contract = (await ethers.getContractAt(
        implementation.interface.format(FormatTypes.full),
        beaconProxyAddr,
    )) as BaseContract;

    return contract;
}
