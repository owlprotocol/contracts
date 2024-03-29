import { HardhatRuntimeEnvironment } from 'hardhat/types';
import { DeployFunction } from 'hardhat-deploy/types';
import { ethers, web3, network } from 'hardhat';
import {
    BeaconProxyInitializable,
    ERC1167Factory,
    NFTOwnershipPaymaster,
    UpgradeableBeaconInitializable,
    FactoryERC721,
} from '../../typechain';

import { getGSNConfig } from '@owlprotocol/contract-helpers-opengsn/src';
import { SignerWithAddress } from '@nomiclabs/hardhat-ethers/signers';

const salt = ethers.utils.formatBytes32String('1');
let NFTOwnershipPaymasterBeaconAddr = '';
const acceptableTokenAddr = '0xe21EBCD28d37A67757B9Bc7b290f4C4928A430b1'; //let it be filled in

const gsnForwarderAddr = '0x' + '0'.repeat(40);
//change to below line eventually
//const gsnForwarderAddr = getGSNConfig(network).forwarder;

const deploy: DeployFunction = async function (hre: HardhatRuntimeEnvironment) {
    if (process.env.PROXY_PRIV_KEY === undefined) return;

    const { deployments, getNamedAccounts } = hre;
    const { other } = await getNamedAccounts();
    const otherSigner = (await ethers.getSigners())[1];

    const { address: proxyAddr } = await deployments.get('ERC1167Factory');
    const { address: beaconProxyAddr } = await deployments.get('BeaconProxyInitializable');
    const { address: beaconAddr } = await deployments.get('UpgradeableBeaconInitializable');
    const { address: NFTOwnershipPaymasterAddr } = await deployments.get('NFTOwnershipPaymaster');

    const proxy = (await ethers.getContractAt('ERC1167Factory', proxyAddr)) as ERC1167Factory;
    const beaconProxy = (await ethers.getContractAt(
        'BeaconProxyInitializable',
        beaconProxyAddr,
    )) as BeaconProxyInitializable;

    const limit = 10;
    const gasLimit = 500000000;

    if (network.name === 'hardhat') {
        NFTOwnershipPaymasterBeaconAddr = await getBeaconAddr(
            proxy,
            otherSigner,
            beaconAddr,
            NFTOwnershipPaymasterAddr,
        );
    }

    const NFTOwnershipPaymasterImpl = (await ethers.getContractAt(
        'NFTOwnershipPaymaster',
        NFTOwnershipPaymasterAddr,
    )) as NFTOwnershipPaymaster;

    const NFTOwnershipPaymasterData = NFTOwnershipPaymasterImpl.interface.encodeFunctionData('proxyinitialize', [
        other,
        acceptableTokenAddr,
        limit,
        gasLimit,
        gsnForwarderAddr,
    ]);

    //Deploy BeaconProxy Instance with ProxyFactory
    const beaconProxyData = beaconProxy.interface.encodeFunctionData('initialize', [
        other,
        NFTOwnershipPaymasterBeaconAddr,
        NFTOwnershipPaymasterData,
    ]);

    const NFTOwnershipPaymasterBPInstAddr = await proxy
        .connect(otherSigner)
        .predictDeterministicAddress(beaconProxyAddr, salt, beaconProxyData);

    if ((await web3.eth.getCode(NFTOwnershipPaymasterBPInstAddr)) !== '0x') {
        console.log(`ERC721 beacon proxy already deployed ${network.name} at ${NFTOwnershipPaymasterBPInstAddr}`);
        return;
    }

    const deployTx = await proxy.connect(otherSigner).cloneDeterministic(beaconProxyAddr, salt, beaconProxyData);
    const receipt = await deployTx.wait();

    console.log(`ERC721 beacon proxy deployed to ${NFTOwnershipPaymasterBPInstAddr} with ${receipt.gasUsed} gas`);
};

async function getBeaconAddr(
    proxy: ERC1167Factory,
    otherSigner: SignerWithAddress,
    beaconAddr: string,
    NFTOwnershipPaymasterAddr: string,
) {
    const beacon = (await ethers.getContractAt(
        'UpgradeableBeaconInitializable',
        beaconAddr,
    )) as UpgradeableBeaconInitializable;

    const NFTOwnershipPaymasterBeaconData = beacon.interface.encodeFunctionData('initialize', [
        otherSigner.address,
        NFTOwnershipPaymasterAddr,
    ]);

    const NFTOwnershipPaymasterBeaconAddr = await proxy
        .connect(otherSigner)
        .predictDeterministicAddress(beaconAddr, salt, NFTOwnershipPaymasterBeaconData);
    return NFTOwnershipPaymasterBeaconAddr;
}

export default deploy;
deploy.tags = ['NFTOwnershipPaymasterInst', 'NFTOwnershipPaymaster', 'BeaconProxy', 'Instance'];
deploy.dependencies = ['BeaconImpl', 'BeaconProxyImpl', 'NFTOwnershipPaymasterImpl', 'NFTOwnershipPaymasterBeacon'];
