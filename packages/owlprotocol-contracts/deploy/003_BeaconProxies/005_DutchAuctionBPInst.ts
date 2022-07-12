import { HardhatRuntimeEnvironment } from 'hardhat/types';
import { DeployFunction } from 'hardhat-deploy/types';
import { ethers, web3, network } from 'hardhat';
import {
    BeaconProxyInitializable,
    ERC1167Factory,
    DutchAuction,
    UpgradeableBeaconInitializable,
    FactoryERC721,
} from '../../typechain';
//import { ERC721BeaconInstAddr } from './000_constants';
import { SignerWithAddress } from '@nomiclabs/hardhat-ethers/signers';

const salt = ethers.utils.formatBytes32String('1');
let dutchAuctionBeaconAddr = '';
let ERC721Contract: FactoryERC721;

const deploy: DeployFunction = async function (hre: HardhatRuntimeEnvironment) {
    if (process.env.PROXY_PRIV_KEY === undefined) return;

    const { deployments, getNamedAccounts } = hre;
    const { other } = await getNamedAccounts();
    const otherSigner = (await ethers.getSigners())[1];

    const { address: proxyAddr } = await deployments.get('ERC1167Factory');
    const { address: beaconProxyAddr } = await deployments.get('BeaconProxyInitializable');
    const { address: beaconAddr } = await deployments.get('UpgradeableBeaconInitializable');
    const { address: dutchAuctionAddr } = await deployments.get('DutchAuction');

    const proxy = (await ethers.getContractAt('ERC1167Factory', proxyAddr)) as ERC1167Factory;
    const beaconProxy = (await ethers.getContractAt(
        'BeaconProxyInitializable',
        beaconProxyAddr,
    )) as BeaconProxyInitializable;

    let acceptableTokenAddr = '';
    let nftForSaleAddr = '';

    if (network.name === 'hardhat') {
        dutchAuctionBeaconAddr = await getBeaconAddr(proxy, otherSigner, beaconAddr, dutchAuctionAddr);

        const { address } = await deployments.get('FactoryERC20');
        acceptableTokenAddr = address;
        const { address: address2 } = await deployments.get('FactoryERC721');
        nftForSaleAddr = address2;
        ERC721Contract = (await ethers.getContractAt('FactoryERC721', address2)) as FactoryERC721;
    }

    const dutchAuctionImpl = (await ethers.getContractAt('DutchAuction', dutchAuctionAddr)) as DutchAuction;

    const dutchAuctionData = dutchAuctionImpl.interface.encodeFunctionData('proxyInitialize', [
        other,
        {
            token: 0,
            contractAddr: acceptableTokenAddr,
            tokenId: 1,
        },
        acceptableTokenAddr,
        2,
        100,
        10,
        false,
        300,
        other,
    ]);

    //Deploy BeaconProxy Instance with ProxyFactory
    const beaconProxyData = beaconProxy.interface.encodeFunctionData('initialize', [
        other,
        dutchAuctionBeaconAddr,
        dutchAuctionData,
    ]);

    const dutchAuctionBPInstAddr = await proxy
        .connect(otherSigner)
        .predictDeterministicAddress(beaconProxyAddr, salt, beaconProxyData);

    if (network.name === 'hardhat') await ERC721Contract.connect(otherSigner).approve(dutchAuctionBPInstAddr, 2);

    if ((await web3.eth.getCode(dutchAuctionBPInstAddr)) !== '0x') {
        console.log(`ERC721 beacon proxy already deployed ${network.name} at ${dutchAuctionBPInstAddr}`);
        return;
    }

    const deployTx = await proxy.connect(otherSigner).cloneDeterministic(beaconProxyAddr, salt, beaconProxyData);
    const receipt = await deployTx.wait();

    console.log(`ERC721 beacon proxy deployed to ${dutchAuctionBPInstAddr} with ${receipt.gasUsed} gas`);
};

async function getBeaconAddr(
    proxy: ERC1167Factory,
    otherSigner: SignerWithAddress,
    beaconAddr: string,
    dutchAuctionAddr: string,
) {
    const beacon = (await ethers.getContractAt(
        'UpgradeableBeaconInitializable',
        beaconAddr,
    )) as UpgradeableBeaconInitializable;

    const dutchAuctionBeaconData = beacon.interface.encodeFunctionData('initialize', [
        otherSigner.address,
        dutchAuctionAddr,
    ]);

    const dutchAuctionBeaconAddr = await proxy
        .connect(otherSigner)
        .predictDeterministicAddress(beaconAddr, salt, dutchAuctionBeaconData);
    return dutchAuctionBeaconAddr;
}

export default deploy;
deploy.tags = ['DutchAuctionInst', 'DutchAuction', 'BeaconProxy', 'Instance'];
deploy.dependencies = ['BeaconImpl', 'BeaconProxyImpl', 'DutchAuctionImpl', 'DutchAuctionBeacon'];
