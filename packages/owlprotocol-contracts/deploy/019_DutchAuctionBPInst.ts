import { HardhatRuntimeEnvironment } from 'hardhat/types';
import { DeployFunction } from 'hardhat-deploy/types';
import { ethers, web3, network } from 'hardhat';
import {
    BeaconProxyInitializable,
    ERC1167Factory,
    DutchAuction,
    UpgradeableBeaconInitializable,
    FactoryERC721,
} from '../typechain';
//import { ERC721BeaconInstAddr } from './000_constants';
import { SignerWithAddress } from '@nomiclabs/hardhat-ethers/signers';

const salt = ethers.utils.formatBytes32String('1');
let dutchAuctionBeaconAddr = '';
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
    const { address: dutchAuctionAddr } = await deployments.get('DutchAuction');

    const proxy = (await ethers.getContractAt('ERC1167Factory', proxyAddr)) as ERC1167Factory;
    const beaconProxy = (await ethers.getContractAt(
        'BeaconProxyInitializable',
        beaconProxyAddr,
    )) as BeaconProxyInitializable;

    let FactoryERC20Addr = '';
    let FactoryERC721Addr = '';

    if (network.name === 'hardhat') {
        dutchAuctionBeaconAddr = await getBeaconAddr(proxy, otherSigner, beaconAddr, dutchAuctionAddr);
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
    console.log('verify', dutchAuctionBeaconAddr);

    const dutchAuctionImpl = (await ethers.getContractAt('DutchAuction', dutchAuctionAddr)) as DutchAuction;

    const dutchAuctionData = dutchAuctionImpl.interface.encodeFunctionData('proxyInitialize', [
        other,
        FactoryERC721Addr,
        1,
        FactoryERC20Addr,
        100,
        10,
        300,
        false,
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

    if (network.name === 'hardhat') await ERC721Contract.connect(otherSigner).approve(dutchAuctionBPInstAddr, 1);

    if ((await web3.eth.getCode(dutchAuctionBPInstAddr)) !== '0x') {
        console.log(`ERC721 beacon proxy already deployed ${network.name} at ${dutchAuctionBPInstAddr}`);
        return;
    }

    const deployTx = await proxy.connect(otherSigner).cloneDeterministic(beaconProxyAddr, salt, beaconProxyData);
    const receipt = await deployTx.wait();

    console.log();
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
