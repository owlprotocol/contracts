import { HardhatRuntimeEnvironment } from 'hardhat/types';
import { DeployFunction } from 'hardhat-deploy/types';
import { ethers, web3, network } from 'hardhat';
import {
    BeaconProxyInitializable,
    ERC1167Factory,
    NaivePaymaster,
    UpgradeableBeaconInitializable,
    FactoryERC721,
} from '../../typechain';

import { SignerWithAddress } from '@nomiclabs/hardhat-ethers/signers';

const salt = ethers.utils.formatBytes32String('1');
let NaivePaymasterBeaconAddr = '';

const deploy: DeployFunction = async function (hre: HardhatRuntimeEnvironment) {
    if (process.env.PROXY_PRIV_KEY === undefined) return;

    const { deployments, getNamedAccounts } = hre;
    const { other } = await getNamedAccounts();
    const otherSigner = (await ethers.getSigners())[1];

    const { address: proxyAddr } = await deployments.get('ERC1167Factory');
    const { address: beaconProxyAddr } = await deployments.get('BeaconProxyInitializable');
    const { address: beaconAddr } = await deployments.get('UpgradeableBeaconInitializable');
    const { address: NaivePaymasterAddr } = await deployments.get('NaivePaymaster');

    const proxy = (await ethers.getContractAt('ERC1167Factory', proxyAddr)) as ERC1167Factory;
    const beaconProxy = (await ethers.getContractAt(
        'BeaconProxyInitializable',
        beaconProxyAddr,
    )) as BeaconProxyInitializable;

    if (network.name === 'hardhat') {
        NaivePaymasterBeaconAddr = await getBeaconAddr(proxy, otherSigner, beaconAddr, NaivePaymasterAddr);
    }

    const NaivePaymasterImpl = (await ethers.getContractAt('NaivePaymaster', NaivePaymasterAddr)) as NaivePaymaster;

    const NaivePaymasterData = NaivePaymasterImpl.interface.encodeFunctionData('proxyinitialize', [
        other,
        other,
        other,
    ]);

    //Deploy BeaconProxy Instance with ProxyFactory
    const beaconProxyData = beaconProxy.interface.encodeFunctionData('initialize', [
        other,
        NaivePaymasterBeaconAddr,
        NaivePaymasterData,
    ]);

    const NaivePaymasterBPInstAddr = await proxy
        .connect(otherSigner)
        .predictDeterministicAddress(beaconProxyAddr, salt, beaconProxyData);


    if ((await web3.eth.getCode(NaivePaymasterBPInstAddr)) !== '0x') {
        console.log(`ERC721 beacon proxy already deployed ${network.name} at ${NaivePaymasterBPInstAddr}`);
        return;
    }

    const deployTx = await proxy.connect(otherSigner).cloneDeterministic(beaconProxyAddr, salt, beaconProxyData);
    const receipt = await deployTx.wait();

    console.log(`ERC721 beacon proxy deployed to ${NaivePaymasterBPInstAddr} with ${receipt.gasUsed} gas`);
};

async function getBeaconAddr(
    proxy: ERC1167Factory,
    otherSigner: SignerWithAddress,
    beaconAddr: string,
    NaivePaymasterAddr: string,
) {
    const beacon = (await ethers.getContractAt(
        'UpgradeableBeaconInitializable',
        beaconAddr,
    )) as UpgradeableBeaconInitializable;

    const NaivePaymasterBeaconData = beacon.interface.encodeFunctionData('initialize', [
        otherSigner.address,
        NaivePaymasterAddr,
    ]);

    const NaivePaymasterBeaconAddr = await proxy
        .connect(otherSigner)
        .predictDeterministicAddress(beaconAddr, salt, NaivePaymasterBeaconData);
    return NaivePaymasterBeaconAddr;
}

export default deploy;
deploy.tags = ['NaivePaymasterInst', 'NaivePaymaster', 'BeaconProxy', 'Instance'];
deploy.dependencies = ['BeaconImpl', 'BeaconProxyImpl', 'NaivePaymasterImpl', 'NaivePaymasterBeacon'];
