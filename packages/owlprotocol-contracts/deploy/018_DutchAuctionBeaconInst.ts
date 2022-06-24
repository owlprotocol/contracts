import { HardhatRuntimeEnvironment } from 'hardhat/types';
import { DeployFunction } from 'hardhat-deploy/types';
import { ethers, web3, network } from 'hardhat';
import { ERC1167Factory, UpgradeableBeaconInitializable } from '../typechain';
//import {dutchAuctionBeaconInstAddr} from './000_constants';

const salt = ethers.utils.formatBytes32String('1');

let dutchAuctionBeaconAddr = '';

const deploy: DeployFunction = async function (hre: HardhatRuntimeEnvironment) {
    const { deployments, getNamedAccounts } = hre;

    if (process.env.PROXY_PRIV_KEY === undefined) return;

    const { other } = await getNamedAccounts();

    const otherSigner = (await ethers.getSigners())[1];

    const { address: proxyAddr } = await deployments.get('ERC1167Factory');
    const { address: beaconAddr } = await deployments.get('UpgradeableBeaconInitializable');
    const { address: dutchAuctionAddr } = await deployments.get('DutchAuction');

    const proxy = (await ethers.getContractAt('ERC1167Factory', proxyAddr)) as ERC1167Factory;
    const beacon = (await ethers.getContractAt(
        'UpgradeableBeaconInitializable',
        beaconAddr,
    )) as UpgradeableBeaconInitializable;

    const dutchAuctionBeaconData = beacon.interface.encodeFunctionData('initialize', [other, dutchAuctionAddr]);

    if (network.name === 'hardhat') {
        dutchAuctionBeaconAddr = await proxy
            .connect(otherSigner)
            .predictDeterministicAddress(beaconAddr, salt, dutchAuctionBeaconData);
    }

    let deployDutchAuctionBeacon;

    let dutchAuctionBeaconTx;

    if ((await web3.eth.getCode(dutchAuctionBeaconAddr)) != '0x')
        console.log(`Dutch Auction beacon already deployed on ${network.name} at ${dutchAuctionBeaconAddr}`);
    else
        deployDutchAuctionBeacon = await proxy
            .connect(otherSigner)
            .cloneDeterministic(beaconAddr, salt, dutchAuctionBeaconData);

    if (deployDutchAuctionBeacon !== undefined) dutchAuctionBeaconTx = await deployDutchAuctionBeacon.wait();

    console.log();
    if (dutchAuctionBeaconTx)
        console.log(
            `Dutch Auction beacon deployed to ${dutchAuctionBeaconAddr} with ${dutchAuctionBeaconTx.gasUsed} gas`,
        );
};

export default deploy;
deploy.tags = ['DutchAuctionBeacon'];
deploy.dependencies = ['BeaconImpl', 'ProxyFactory', 'DutchAuctionImpl'];
