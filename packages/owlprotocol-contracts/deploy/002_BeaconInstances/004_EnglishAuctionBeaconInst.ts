import { HardhatRuntimeEnvironment } from 'hardhat/types';
import { DeployFunction } from 'hardhat-deploy/types';
import { ethers, web3, network } from 'hardhat';
import { ERC1167Factory, UpgradeableBeaconInitializable } from '../../typechain';
import { englishAuctionBeaconInstAddr } from '../../constants/addresses';

const salt = ethers.utils.formatBytes32String('1');

let englishAuctionBeaconAddr = englishAuctionBeaconInstAddr;

const deploy: DeployFunction = async function (hre: HardhatRuntimeEnvironment) {
    const { deployments, getNamedAccounts } = hre;

    if (process.env.PROXY_PRIV_KEY === undefined) return;

    const { other } = await getNamedAccounts();

    const otherSigner = (await ethers.getSigners())[1];

    const { address: proxyAddr } = await deployments.get('ERC1167Factory');
    const { address: beaconAddr } = await deployments.get('UpgradeableBeaconInitializable');
    const { address: EnglishAuctionAddr } = await deployments.get('EnglishAuction');

    const proxy = (await ethers.getContractAt('ERC1167Factory', proxyAddr)) as ERC1167Factory;
    const beacon = (await ethers.getContractAt(
        'UpgradeableBeaconInitializable',
        beaconAddr,
    )) as UpgradeableBeaconInitializable;

    const EnglishAuctionBeaconData = beacon.interface.encodeFunctionData('initialize', [other, EnglishAuctionAddr]);

    if (network.name === 'hardhat') {
        englishAuctionBeaconAddr = await proxy
            .connect(otherSigner)
            .predictDeterministicAddress(beaconAddr, salt, EnglishAuctionBeaconData);
    }

    let deployEnglishAuctionBeacon;
    let englishAuctionBeaconTx;

    if ((await web3.eth.getCode(englishAuctionBeaconAddr)) != '0x')
        console.log(`EnglishAuction beacon already deployed on ${network.name} at ${englishAuctionBeaconAddr}`);
    else
        deployEnglishAuctionBeacon = await proxy
            .connect(otherSigner)
            .cloneDeterministic(beaconAddr, salt, EnglishAuctionBeaconData);

    if (deployEnglishAuctionBeacon !== undefined) englishAuctionBeaconTx = await deployEnglishAuctionBeacon.wait();

    if (englishAuctionBeaconTx)
        console.log(
            `English Auction beacon deployed to ${englishAuctionBeaconAddr} with ${englishAuctionBeaconTx.gasUsed} gas`,
        );
};

export default deploy;
deploy.tags = ['EnglishAuctionBeacon', 'EnglishAuction', 'Beacons'];
deploy.dependencies = ['EnglishAuctionImpl', 'BeaconImpl', 'ProxyFactory'];
