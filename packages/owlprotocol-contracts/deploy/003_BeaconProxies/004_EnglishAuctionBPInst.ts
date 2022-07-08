// import { HardhatRuntimeEnvironment } from 'hardhat/types';
// import { DeployFunction } from 'hardhat-deploy/types';
// import { ethers, web3, network } from 'hardhat';
// import {
//     BeaconProxyInitializable,
//     ERC1167Factory,
//     EnglishAuction,
//     UpgradeableBeaconInitializable,
//     FactoryERC721,
// } from '../../typechain';
// import { SignerWithAddress } from '@nomiclabs/hardhat-ethers/signers';

// const salt = ethers.utils.formatBytes32String('1');
// let EnglishAuctionBeaconAddr = '';
// let ERC721Contract: FactoryERC721;

// const deploy: DeployFunction = async function (hre: HardhatRuntimeEnvironment) {
//     if (process.env.PRIV_KEY === undefined) return;

//     const { deployments, getNamedAccounts } = hre;
//     const { other } = await getNamedAccounts();
//     const otherSigner = (await ethers.getSigners())[1];

//     const { address: proxyAddr } = await deployments.get('ERC1167Factory');
//     const { address: beaconProxyAddr } = await deployments.get('BeaconProxyInitializable');
//     const { address: beaconAddr } = await deployments.get('UpgradeableBeaconInitializable');
//     const { address: EnglishAuctionAddr } = await deployments.get('EnglishAuction');

//     const proxy = (await ethers.getContractAt('ERC1167Factory', proxyAddr)) as ERC1167Factory;
//     const beaconProxy = (await ethers.getContractAt(
//         'BeaconProxyInitializable',
//         beaconProxyAddr,
//     )) as BeaconProxyInitializable;

//     let acceptableTokenAddr = '';
//     let nftForSaleAddr = '';

//     if (network.name === 'hardhat') {
//         EnglishAuctionBeaconAddr = await getBeaconAddr(proxy, otherSigner, beaconAddr, EnglishAuctionAddr);

//         const { address } = await deployments.get('FactoryERC20');
//         acceptableTokenAddr = address;
//         const { address: address2 } = await deployments.get('FactoryERC721');
//         nftForSaleAddr = address2;
//         ERC721Contract = (await ethers.getContractAt('FactoryERC721', address2)) as FactoryERC721;
//     }

//     const EnglishAuctionImpl = (await ethers.getContractAt('EnglishAuction', EnglishAuctionAddr)) as EnglishAuction;

//     const EnglishAuctionData = EnglishAuctionImpl.interface.encodeFunctionData('proxyInitialize', [
//         other,
//         nftForSaleAddr,
//         acceptableTokenAddr,
//         1,
//         10,
//         10,
//         1,
//         other, // TODO - this should be the royalty owner
//     ]);

//     //Deploy BeaconProxy Instance with ProxyFactory
//     const beaconProxyData = beaconProxy.interface.encodeFunctionData('initialize', [
//         other,
//         EnglishAuctionBeaconAddr,
//         EnglishAuctionData,
//     ]);

//     const EnglishAuctionBPInstAddr = await proxy
//         .connect(otherSigner)
//         .predictDeterministicAddress(beaconProxyAddr, salt, beaconProxyData);

//     if (network.name === 'hardhat') await ERC721Contract.connect(otherSigner).approve(EnglishAuctionBPInstAddr, 1);

//     if ((await web3.eth.getCode(EnglishAuctionBPInstAddr)) !== '0x') {
//         console.log(`English Auction beacon proxy already deployed ${network.name} at ${EnglishAuctionBPInstAddr}`);
//         return;
//     }

//     const deployTx = await proxy.connect(otherSigner).cloneDeterministic(beaconProxyAddr, salt, beaconProxyData);
//     const receipt = await deployTx.wait();

//     console.log(`English Auction beacon proxy deployed to ${EnglishAuctionBPInstAddr} with ${receipt.gasUsed} gas`);
// };

// async function getBeaconAddr(
//     proxy: ERC1167Factory,
//     otherSigner: SignerWithAddress,
//     beaconAddr: string,
//     EnglishAuctionAddr: string,
// ) {
//     const beacon = (await ethers.getContractAt(
//         'UpgradeableBeaconInitializable',
//         beaconAddr,
//     )) as UpgradeableBeaconInitializable;

//     const EnglishAuctionBeaconData = beacon.interface.encodeFunctionData('initialize', [
//         otherSigner.address,
//         EnglishAuctionAddr,
//     ]);

//     const EnglishAuctionBeaconAddr = await proxy
//         .connect(otherSigner)
//         .predictDeterministicAddress(beaconAddr, salt, EnglishAuctionBeaconData);
//     return EnglishAuctionBeaconAddr;
// }

// export default deploy;
// deploy.tags = ['EnglishAuctionInst', 'EnglishAuction', 'BeaconProxy', 'Instance'];
// deploy.dependencies = ['BeaconImpl', 'BeaconProxyImpl', 'EnglishAuctionImpl', 'EnglishAuctionBeacon'];
