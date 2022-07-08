import { HardhatRuntimeEnvironment } from 'hardhat/types';
import { DeployFunction } from 'hardhat-deploy/types';
import { ethers, web3, network } from 'hardhat';
import { BeaconProxyInitializable, ERC1167Factory, ERC1155Owl, UpgradeableBeaconInitializable } from '../../typechain';
import { ERC1155BeaconInstAddr } from '../../constants/addresses';
import { SignerWithAddress } from '@nomiclabs/hardhat-ethers/signers';

const salt = ethers.utils.formatBytes32String('1');
let ERC1155BeaconAddr = ERC1155BeaconInstAddr;

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

    if (network.name === 'hardhat')
        ERC1155BeaconAddr = await getBeaconAddr(proxy, otherSigner, beaconAddr, ERC1155Addr);

    const ERC1155Impl = (await ethers.getContractAt('ERC1155Owl', ERC1155Addr)) as ERC1155Owl;

    const ERC1155Data = ERC1155Impl.interface.encodeFunctionData('proxyInitialize', [
        other,
        'ipfs://QmaWCmXshn6Tk81hpape3kCvTgpjkTQAnDamVuHeY46Tnu/{id}.json',
        'testuri',
    ]);

    //Deploy BeaconProxy Instance with ProxyFactory
    const beaconProxyData = beaconProxy.interface.encodeFunctionData('initialize', [
        other,
        ERC1155BeaconAddr,
        ERC1155Data,
    ]);

    const ERC1155BPInstAddr = await proxy
        .connect(otherSigner)
        .predictDeterministicAddress(beaconProxyAddr, salt, beaconProxyData);

    if ((await web3.eth.getCode(ERC1155BPInstAddr)) !== '0x') {
        console.log(`ERC1155 beacon proxy already deployed ${network.name} at ${ERC1155BPInstAddr}`);
        return;
    }

    const deployTx = await proxy.connect(otherSigner).cloneDeterministic(beaconProxyAddr, salt, beaconProxyData);
    const receipt = await deployTx.wait();

    console.log(`ERC1155 beacon proxy deployed to ${ERC1155BPInstAddr} with ${receipt.gasUsed} gas`);
};

async function getBeaconAddr(
    proxy: ERC1167Factory,
    otherSigner: SignerWithAddress,
    beaconAddr: string,
    ERC1155Addr: string,
) {
    const beacon = (await ethers.getContractAt(
        'UpgradeableBeaconInitializable',
        beaconAddr,
    )) as UpgradeableBeaconInitializable;

    const ERC1155BeaconData = beacon.interface.encodeFunctionData('initialize', [otherSigner.address, ERC1155Addr]);

    const ERC1155BeaconAddr = await proxy
        .connect(otherSigner)
        .predictDeterministicAddress(beaconAddr, salt, ERC1155BeaconData);
    return ERC1155BeaconAddr;
}
export default deploy;
deploy.tags = ['ERC1155Inst', 'ERC1155', 'BeaconProxy', 'Instance'];
deploy.dependencies = ['BeaconImpl', 'ERC721Impl', 'ERC1155Impl', 'CrafterTransferImpl', 'BeaconProxyImpl', 'Beacons'];
