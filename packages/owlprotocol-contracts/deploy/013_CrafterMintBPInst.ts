import { ethers } from 'hardhat';
import { DeployFunction } from 'hardhat-deploy/types';
import { HardhatRuntimeEnvironment } from 'hardhat/types';
import {
    BeaconProxyInitializable,
    CrafterMint,
    ERC1155Owl,
    ERC1167Factory,
    ERC721Owl,
    UpgradeableBeaconInitializable,
} from '../typechain';

const tokenIds = [
    '15532881770934585726362572820003503218105251610',
    '22669120234464385131654002667250978900018984730',
    '11251138692816706083187714911655017808957011738',
    '5542147921992866558954571033857037263426025242',
    '23739556003993855042447717144338100252306044698',
    '23025931936180581485115997338265290227201491226',
    '29448546774817694566680861022136080797837031194',
    '35157537545641534090914004899934061343368017690',
    '40866528316465373615147148777732041888899004186',
    '45861895240936232901745540205708751110725437210',
];

const ERC1115Amounts = [2, 2, 2, 1, 1, 1, 2];
const ERC1155Ids = [0, 1, 2, 3, 4, 5, 6];

const salt = ethers.utils.formatBytes32String('1');

const deploy: DeployFunction = async function (hre: HardhatRuntimeEnvironment) {
    // const { deployments, getNamedAccounts } = hre;
    // const { other } = await getNamedAccounts();
    // if (process.env.PRIV_KEY === undefined) return;
    // const { address: proxyAddr } = await deployments.get('ERC1167Factory');
    // const { address: beaconProxyAddr } = await deployments.get('BeaconProxyInitializable');
    // const { address: beaconAddr } = await deployments.get('UpgradeableBeaconInitializable');
    // const { address: ERC721Addr } = await deployments.get('ERC721Owl');
    // const { address: ERC1155Addr } = await deployments.get('ERC1155Owl');
    // const { address: crafterMintAddr } = await deployments.get('CrafterMint');
    // const proxy = (await ethers.getContractAt('ERC1167Factory', proxyAddr)) as ERC1167Factory;
    // const beaconProxy = (await ethers.getContractAt(
    //     'BeaconProxyInitializable',
    //     beaconProxyAddr,
    // )) as BeaconProxyInitializable;
    // const beacon = (await ethers.getContractAt(
    //     'UpgradeableBeaconInitializable',
    //     beaconProxyAddr,
    // )) as UpgradeableBeaconInitializable;
    // const crafterMint = (await ethers.getContractAt('CrafterMint', crafterMintAddr)) as CrafterMint;
    // //Calculate ERC721 instance address
    // const ERC721BeaconData = beacon.interface.encodeFunctionData('initialize', [other, ERC721Addr]);
    // const ERC721BeaconInstAddr = await proxy.predictDeterministicAddress(beaconAddr, salt, ERC721BeaconData);
    // const ERC721Impl = (await ethers.getContractAt('ERC721Owl', ERC721Addr)) as ERC721Owl;
    // const ERC721Data = ERC721Impl.interface.encodeFunctionData('proxyInitialize', [
    //     other,
    //     'CryptoOwls',
    //     'OWL',
    //     'https://api.istio.owlprotocol.xyz/metadata/getMetadata/QmcunXcWbn2fZ7UyNXC954AVEz1uoPA4MbbgHwg6z52PAM/',
    // ]);
    // const ERC721BeaconProxyData = beaconProxy.interface.encodeFunctionData('initialize', [
    //     other,
    //     ERC721BeaconInstAddr,
    //     ERC721Data,
    // ]);
    // const ERC721BPInstAddr = await proxy.predictDeterministicAddress(beaconProxyAddr, salt, ERC721BeaconProxyData);
    // //Calculate ERC1155 instance address
    // const ERC1155BeaconData = beacon.interface.encodeFunctionData('initialize', [other, ERC1155Addr]);
    // const ERC1155BeaconInstAddr = await proxy.predictDeterministicAddress(beaconAddr, salt, ERC1155BeaconData);
    // const ERC1155Impl = (await ethers.getContractAt('ERC1155Owl', ERC1155Addr)) as ERC1155Owl;
    // const ERC1155Data = ERC1155Impl.interface.encodeFunctionData('proxyInitialize', [
    //     other,
    //     'ipfs://QmaWCmXshn6Tk81hpape3kCvTgpjkTQAnDamVuHeY46Tnu',
    // ]);
    // const ERC1155BeaconProxyData = beaconProxy.interface.encodeFunctionData('initialize', [
    //     other,
    //     ERC1155BeaconInstAddr,
    //     ERC1155Data,
    // ]);
    // const ERC1155BPInstAddr = await proxy.predictDeterministicAddress(beaconProxyAddr, salt, ERC1155BeaconProxyData);
    // //DEPLOY CRAFTER TRANSFER
    // const CrafterMintData = crafterMint.interface.encodeFunctionData('initialize', [
    //     other,
    //     other,
    //     10,
    //     [
    //         {
    //             token: 2,
    //             consumableType: 1,
    //             contractAddr: ERC1155BPInstAddr,
    //             amounts: ERC1115Amounts,
    //             tokenIds: ERC1155Ids,
    //         },
    //     ],
    //     [
    //         {
    //             token: 1,
    //             consumableType: 0,
    //             contractAddr: ERC721BPInstAddr,
    //             amounts: [],
    //             tokenIds,
    //         },
    //     ],
    // ]);
    // const crafterMintBPInstAddr = await proxy.predictDeterministicAddress(crafterMintAddr, salt, CrafterMintData);
    // const deployCrafterMint = await proxy.cloneDeterministic(crafterMintAddr, salt, CrafterMintData);
    // const deployReceipt = await deployCrafterMint.wait();
    // console.log(`CrafterMint beacon proxy deployed to ${crafterMintBPInstAddr} with ${deployReceipt.gasUsed} gas`);
};
export default deploy;
// deploy.tags = ['CrafterMint', 'BeaconProxy', 'Instance'];
// deploy.dependencies = ['CrafterMintImpl', 'BeaconProxyImpl', 'Beacons'];
