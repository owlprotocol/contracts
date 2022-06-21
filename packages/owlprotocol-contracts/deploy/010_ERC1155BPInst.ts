import { HardhatRuntimeEnvironment } from 'hardhat/types';
import { DeployFunction } from 'hardhat-deploy/types';
import { ethers } from 'hardhat';
import { BeaconProxyInitializable, ERC1167Factory, ERC1155Owl, UpgradeableBeaconInitializable } from '../typechain';

const salt = ethers.utils.formatBytes32String('1');
// const proxyAddr = '0xDdE49F4aC07CdFa60B0559803EeE4A520c2611ED';

const deploy: DeployFunction = async function (hre: HardhatRuntimeEnvironment) {
    const { deployments, getNamedAccounts } = hre;

    if (process.env.PRIV_KEY === undefined) return;

    const { other } = await getNamedAccounts();

    const otherSigner = (await ethers.getSigners())[1];

    const { address: proxyAddr } = await deployments.get('ERC1167Factory');
    const { address: beaconProxyAddr } = await deployments.get('BeaconProxyInitializable');
    const { address: beaconAddr } = await deployments.get('UpgradeableBeaconInitializable');
    const { address: ERC1155Addr } = await deployments.get('ERC1155Owl');

    const proxy = (await ethers.getContractAt('ERC1167Factory', proxyAddr)) as ERC1167Factory;
    const beaconProxy = (await ethers.getContractAt(
        'BeaconProxyInitializable',
        beaconProxyAddr,
    )) as BeaconProxyInitializable;
    const beacon = (await ethers.getContractAt(
        'UpgradeableBeaconInitializable',
        beaconProxyAddr,
    )) as UpgradeableBeaconInitializable;

    const ERC1155BeaconData = beacon.interface.encodeFunctionData('initialize', [other, ERC1155Addr]);

    const ERC1155BeaconInstAddr = await proxy
        .connect(otherSigner)
        .predictDeterministicAddress(beaconAddr, salt, ERC1155BeaconData);

    const ERC1155Impl = (await ethers.getContractAt('ERC1155Owl', ERC1155Addr)) as ERC1155Owl;

    const ERC1155Data = ERC1155Impl.interface.encodeFunctionData('proxyInitialize', [
        other,
        'ipfs://QmaWCmXshn6Tk81hpape3kCvTgpjkTQAnDamVuHeY46Tnu/{id}.json',
    ]);

    //Deploy BeaconProxy Instance with ProxyFactory
    const beaconProxyData = beaconProxy.interface.encodeFunctionData('initialize', [
        other,
        ERC1155BeaconInstAddr,
        ERC1155Data,
    ]);

    const ERC1155BPInstAddr = await proxy
        .connect(otherSigner)
        .predictDeterministicAddress(beaconProxyAddr, salt, beaconProxyData);

    const deployTx = await proxy.connect(otherSigner).cloneDeterministic(beaconProxyAddr, salt, beaconProxyData);
    const receipt = await deployTx.wait();

    console.log(`ERC1155 beacon proxy deployed to ${ERC1155BPInstAddr} with ${receipt.gasUsed} gas`);
};

export default deploy;
deploy.tags = ['ERC1155Inst', 'ERC115', 'BeaconProxy', 'Instance'];
deploy.dependencies = ['ERC1155Impl', 'BeaconProxyImpl', 'Beacons'];
