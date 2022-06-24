import { HardhatRuntimeEnvironment } from 'hardhat/types';
import { DeployFunction } from 'hardhat-deploy/types';
import { ethers, web3, network } from 'hardhat';
import { BeaconProxyInitializable, ERC1167Factory, ERC721Owl, UpgradeableBeaconInitializable } from '../typechain';
import { ERC721BeaconInstAddr } from '../constants/addresses';
import { SignerWithAddress } from '@nomiclabs/hardhat-ethers/signers';

const salt = ethers.utils.formatBytes32String('1');
let ERC721BeaconAddr = ERC721BeaconInstAddr;

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

    if (network.name === 'hardhat') ERC721BeaconAddr = await getBeaconAddr(proxy, otherSigner, beaconAddr, ERC721Addr);

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
        ERC721BeaconAddr,
        ERC721Data,
    ]);

    const ERC721BPInstAddr = await proxy
        .connect(otherSigner)
        .predictDeterministicAddress(beaconProxyAddr, salt, beaconProxyData);

    if ((await web3.eth.getCode(ERC721BPInstAddr)) !== '0x') {
        console.log(`ERC721 beacon proxy already deployed ${network.name} at ${ERC721BPInstAddr}`);
        return;
    }

    const deployTx = await proxy.connect(otherSigner).cloneDeterministic(beaconProxyAddr, salt, beaconProxyData);
    const receipt = await deployTx.wait();

    console.log();
    console.log(`ERC721 beacon proxy deployed to ${ERC721BPInstAddr} with ${receipt.gasUsed} gas`);
};

async function getBeaconAddr(
    proxy: ERC1167Factory,
    otherSigner: SignerWithAddress,
    beaconAddr: string,
    ERC721Addr: string,
) {
    const beacon = (await ethers.getContractAt(
        'UpgradeableBeaconInitializable',
        beaconAddr,
    )) as UpgradeableBeaconInitializable;

    const ERC721BeaconData = beacon.interface.encodeFunctionData('initialize', [otherSigner.address, ERC721Addr]);

    const ERC721BeaconAddr = await proxy
        .connect(otherSigner)
        .predictDeterministicAddress(beaconAddr, salt, ERC721BeaconData);
    return ERC721BeaconAddr;
}

export default deploy;
deploy.tags = ['ERC721Inst', 'ERC721', 'BeaconProxy', 'Instance'];
deploy.dependencies = ['BeaconImpl', 'BeaconProxyImpl', 'ERC721Impl', 'ERC1155Impl', 'CrafterTransferImpl', 'Beacons'];
