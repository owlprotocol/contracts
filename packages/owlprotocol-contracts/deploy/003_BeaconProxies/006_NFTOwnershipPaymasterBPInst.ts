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

import { SignerWithAddress } from '@nomiclabs/hardhat-ethers/signers';

const salt = ethers.utils.formatBytes32String('1');
let NFTOwnershipPaymasterBeaconAddr = '';
let ERC721Contract: FactoryERC721;

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

    let acceptableTokenAddr = '';
    let limit;

    if (network.name === 'hardhat') {
        NFTOwnershipPaymasterBeaconAddr = await getBeaconAddr(
            proxy,
            otherSigner,
            beaconAddr,
            NFTOwnershipPaymasterAddr,
        );

        const { address } = await deployments.get('FactoryERC721');
        acceptableTokenAddr = address;
        const { address: address2 } = await deployments.get('FactoryERC721');
        ERC721Contract = (await ethers.getContractAt('FactoryERC721', address2)) as FactoryERC721;
    }

    const NFTOwnershipPaymasterImpl = (await ethers.getContractAt(
        'NFTOwnershipPaymaster',
        NFTOwnershipPaymasterAddr,
    )) as NFTOwnershipPaymaster;

    const NFTOwnershipPaymasterData = NFTOwnershipPaymasterImpl.interface.encodeFunctionData('proxyinitialize', [
        other,
        acceptableTokenAddr,
        limit,
        other,
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

    if (network.name === 'hardhat')
        await ERC721Contract.connect(otherSigner).approve(NFTOwnershipPaymasterBPInstAddr, 2);

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
