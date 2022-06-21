import { HardhatRuntimeEnvironment } from 'hardhat/types';
import { DeployFunction } from 'hardhat-deploy/types';
import { ethers } from 'hardhat';
import { BeaconProxyInitializable, ERC1167Factory, ERC721Owl, UpgradeableBeaconInitializable } from '../typechain';

const salt = ethers.utils.formatBytes32String('1');
// const proxyAddr = '0xDdE49F4aC07CdFa60B0559803EeE4A520c2611ED';
// const ERC721Addr = '0x4ee2D9cc8395f297183341acE35214E21666C71B';

const deploy: DeployFunction = async function (hre: HardhatRuntimeEnvironment) {
    const { deployments, getNamedAccounts } = hre;

    if (process.env.PRIV_KEY === undefined) return;

    const { other } = await getNamedAccounts();

    const otherSigner = (await ethers.getSigners())[1];

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

    const ERC721BeaconInstAddr = await proxy
        .connect(otherSigner)
        .predictDeterministicAddress(beaconAddr, salt, ERC721BeaconData);

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

    const ERC721BPInstAddr = await proxy
        .connect(otherSigner)
        .predictDeterministicAddress(beaconProxyAddr, salt, beaconProxyData);

    const deployTx = await proxy.connect(otherSigner).cloneDeterministic(beaconProxyAddr, salt, beaconProxyData);
    const receipt = await deployTx.wait();

    console.log();
    console.log(`ERC721 beacon proxy deployed to ${ERC721BPInstAddr} with ${receipt.gasUsed} gas`);
};

export default deploy;
deploy.tags = ['ERC721Inst', 'ERC721', 'BeaconProxy', 'Instance'];
deploy.dependencies = ['ERC721Impl', 'BeaconProxyImpl', 'Beacons'];
