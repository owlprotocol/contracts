import { HardhatRuntimeEnvironment } from 'hardhat/types';
import { Address, DeployFunction } from 'hardhat-deploy/types';
import { ethers, web3, network } from 'hardhat';
import {
    BeaconProxyInitializable,
    ERC1167Factory,
    EnglishAuction,
    UpgradeableBeaconInitializable,
    FactoryERC721,
} from '../typechain';
//import { EnglishAuctionBeaconInstAddr } from './000_constants';
import { SignerWithAddress } from '@nomiclabs/hardhat-ethers/signers';

const salt = ethers.utils.formatBytes32String('1');
let EnglishAuctionBeaconAddr = '';
let ERC721Contract: FactoryERC721;

const deploy: DeployFunction = async function (hre: HardhatRuntimeEnvironment) {
    const { deployments, getNamedAccounts } = hre;
    const { deploy } = deployments;

    if (process.env.PRIV_KEY === undefined) return;

    const { deployer, other } = await getNamedAccounts();

    const otherSigner = (await ethers.getSigners())[1];

    const { address: proxyAddr } = await deployments.get('ERC1167Factory');
    const { address: beaconProxyAddr } = await deployments.get('BeaconProxyInitializable');
    const { address: beaconAddr } = await deployments.get('UpgradeableBeaconInitializable');
    const { address: EnglishAuctionAddr } = await deployments.get('EnglishAuction');

    const proxy = (await ethers.getContractAt('ERC1167Factory', proxyAddr)) as ERC1167Factory;
    const beaconProxy = (await ethers.getContractAt(
        'BeaconProxyInitializable',
        beaconProxyAddr,
    )) as BeaconProxyInitializable;

    //depolyment address for beacon instance = predict determininstic in BP instance

    let FactoryERC20Addr = '';
    let FactoryERC721Addr = '';

    if (network.name === 'hardhat') {
        EnglishAuctionBeaconAddr = await getBeaconAddr(proxy, otherSigner, beaconAddr, EnglishAuctionAddr);
        await deploy('FactoryERC20', {
            from: deployer,
            args: [0, 'name', 'ticker'],
            log: true,
        });
        const { address } = await deployments.get('FactoryERC20');
        FactoryERC20Addr = address;

        await deploy('FactoryERC721', {
            from: deployer,
            args: ['name', 'symbol'],
            log: true,
        });
        const { address: address2 } = await deployments.get('FactoryERC721');
        FactoryERC721Addr = address2;
        ERC721Contract = (await ethers.getContractAt('FactoryERC721', FactoryERC721Addr)) as FactoryERC721;
        await ERC721Contract.mint(other, 1);
    }

    const EnglishAuctionImpl = (await ethers.getContractAt('EnglishAuction', EnglishAuctionAddr)) as EnglishAuction;

    const EnglishAuctionData = EnglishAuctionImpl.interface.encodeFunctionData('proxyInitialize', [
        other,
        FactoryERC721Addr,
        1,
        FactoryERC20Addr,
        10,
        10,
        1,
    ]);

    //Deploy BeaconProxy Instance with ProxyFactory
    const beaconProxyData = beaconProxy.interface.encodeFunctionData('initialize', [
        other,
        EnglishAuctionBeaconAddr,
        EnglishAuctionData,
    ]);

    const EnglishAuctionBPInstAddr = await proxy
        .connect(otherSigner)
        .predictDeterministicAddress(beaconProxyAddr, salt, beaconProxyData);

    if (network.name === 'hardhat') await ERC721Contract.connect(otherSigner).approve(EnglishAuctionBPInstAddr, 1);

    if ((await web3.eth.getCode(EnglishAuctionBPInstAddr)) !== '0x') {
        console.log(`English Auction beacon proxy already deployed ${network.name} at ${EnglishAuctionBPInstAddr}`);
        return;
    }

    const deployTx = await proxy.connect(otherSigner).cloneDeterministic(beaconProxyAddr, salt, beaconProxyData);
    const receipt = await deployTx.wait();

    console.log();
    console.log(`English Auction beacon proxy deployed to ${EnglishAuctionBPInstAddr} with ${receipt.gasUsed} gas`);
};

async function getBeaconAddr(
    proxy: ERC1167Factory,
    otherSigner: SignerWithAddress,
    beaconAddr: string,
    EnglishAuctionAddr: string,
) {
    const beacon = (await ethers.getContractAt(
        'UpgradeableBeaconInitializable',
        beaconAddr,
    )) as UpgradeableBeaconInitializable;

    const EnglishAuctionBeaconData = beacon.interface.encodeFunctionData('initialize', [
        otherSigner.address,
        EnglishAuctionAddr,
    ]);

    const EnglishAuctionBeaconAddr = await proxy
        .connect(otherSigner)
        .predictDeterministicAddress(beaconAddr, salt, EnglishAuctionBeaconData);
    return EnglishAuctionBeaconAddr;
}

export default deploy;
deploy.tags = ['EnglishAuctionInst', 'EnglishAuction', 'BeaconProxy', 'Instance'];
deploy.dependencies = ['BeaconImpl', 'BeaconProxyImpl', 'EnglishAuctionImpl', 'EnglishAuctionBeacon'];
