import { HardhatRuntimeEnvironment } from 'hardhat/types';
import { DeployFunction } from 'hardhat-deploy/types';
import { ethers } from 'hardhat';
import { BeaconProxyInitializable, ERC1167Factory, ERC721Owl, UpgradeableBeaconInitializable } from '../typechain';

const salt = ethers.utils.formatBytes32String('1');

const deploy: DeployFunction = async function (hre: HardhatRuntimeEnvironment) {
    const { deployments, getNamedAccounts } = hre;
    const { other } = await getNamedAccounts();
    if (process.env.PRIV_KEY === undefined) return;

    const { address: proxyAddr } = await deployments.get('ERC1167Factory');
    const { address: beaconProxyAddr } = await deployments.get('BeaconProxyInitializable');
    const { address: beaconAddr } = await deployments.get('UpgradeableBeaconInitializable');
    const { address: ERC721Addr } = await deployments.get('ERC721Owl');

    const proxy = (await ethers.getContractAt('ERC1167Factory', proxyAddr)) as ERC1167Factory;
    const beaconProxy = (await ethers.getContractAt(
        'BeaconProxyInitializable',
        beaconProxyAddr,
    )) as BeaconProxyInitializable;
    const beacon = (await ethers.getContractAt(
        'UpgradeableBeaconInitializable',
        beaconProxyAddr,
    )) as UpgradeableBeaconInitializable;

    const ERC721BeaconData = beacon.interface.encodeFunctionData('initialize', [other, ERC721Addr]);

    const ERC721BeaconInstAddr = await proxy.predictDeterministicAddress(beaconAddr, salt, ERC721BeaconData);

    const ERC721Impl = (await ethers.getContractAt('ERC721Owl', ERC721Addr)) as ERC721Owl;

    const ERC721Data = ERC721Impl.interface.encodeFunctionData('proxyInitialize', [
        other,
        'CryptoOwls',
        'OWL',
        'https://api.istio.owlprotocol.xyz/metadata/getMetadata/QmcunXcWbn2fZ7UyNXC954AVEz1uoPA4MbbgHwg6z52PAM/',
    ]);

    //Deploy BeaconProxy Instance with ProxyFactory
    const beaconProxyData = beaconProxy.interface.encodeFunctionData('initialize', [
        other,
        ERC721BeaconInstAddr,
        ERC721Data,
    ]);

    const ERC721BPInstAddr = await proxy.predictDeterministicAddress(beaconProxyAddr, salt, beaconProxyData);

    const deployTx = await proxy.cloneDeterministic(beaconProxyAddr, salt, beaconProxyData);
    const receipt = await deployTx.wait();

    console.log();
    console.log(`ERC721 beacon proxy deployed to ${ERC721BPInstAddr} with ${receipt.gasUsed} gas`);
};

export default deploy;
deploy.tags = ['BeaconProxy', 'Instance'];
deploy.dependencies = ['Implementation', 'Beacons'];
