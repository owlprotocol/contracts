import { HardhatRuntimeEnvironment } from 'hardhat/types';
import { DeployFunction } from 'hardhat-deploy/types';
import { ethers, web3, network } from 'hardhat';
import { ERC1167Factory, UpgradeableBeaconInitializable } from '../typechain';
import { ERC721BeaconInstAddr, ERC1155BeaconInstAddr, crafterTransferBeaconInstAddr } from './000_constants';

const salt = ethers.utils.formatBytes32String('1');

let ERC721BeaconAddr = ERC721BeaconInstAddr;
let ERC1155BeaconAddr = ERC1155BeaconInstAddr;
let crafterTransferBeaconAddr = crafterTransferBeaconInstAddr;

const deploy: DeployFunction = async function (hre: HardhatRuntimeEnvironment) {
    const { deployments, getNamedAccounts } = hre;

    if (process.env.PROXY_PRIV_KEY === undefined) return;

    const { other } = await getNamedAccounts();

    const otherSigner = (await ethers.getSigners())[1];

    const { address: proxyAddr } = await deployments.get('ERC1167Factory');
    const { address: beaconAddr } = await deployments.get('UpgradeableBeaconInitializable');
    const { address: ERC721Addr } = await deployments.get('ERC721Owl');
    const { address: ERC1155Addr } = await deployments.get('ERC1155Owl');
    const { address: crafterTransferAddr } = await deployments.get('CrafterTransfer');

    const proxy = (await ethers.getContractAt('ERC1167Factory', proxyAddr)) as ERC1167Factory;
    const beacon = (await ethers.getContractAt(
        'UpgradeableBeaconInitializable',
        beaconAddr,
    )) as UpgradeableBeaconInitializable;

    const ERC721BeaconData = beacon.interface.encodeFunctionData('initialize', [
        other,
        '0x4ee2D9cc8395f297183341acE35214E21666C71B',
    ]);
    const ERC1155BeaconData = beacon.interface.encodeFunctionData('initialize', [other, ERC1155Addr]);
    const crafterTransferBeaconData = beacon.interface.encodeFunctionData('initialize', [other, crafterTransferAddr]);

    if (network.name === 'hardhat') {
        ERC721BeaconAddr = await proxy
            .connect(otherSigner)
            .predictDeterministicAddress(beaconAddr, salt, ERC721BeaconData);
        ERC1155BeaconAddr = await proxy
            .connect(otherSigner)
            .predictDeterministicAddress(beaconAddr, salt, ERC1155BeaconData);
        crafterTransferBeaconAddr = await proxy
            .connect(otherSigner)
            .predictDeterministicAddress(beaconAddr, salt, crafterTransferBeaconData);
    }

    console.log(await proxy.connect(otherSigner).predictDeterministicAddress(beaconAddr, salt, ERC721BeaconData));

    let deployERC721Beacon;
    let deployERC1155Beacon;
    let deployCrafterTransferBeacon;

    let ERC721BeaconTx;
    let ERC1155BeaconTx;
    let crafterTransferBeaconTx;

    if ((await web3.eth.getCode(ERC721BeaconAddr)) != '0x')
        console.log(`erc721 beacon already deployed on ${network.name} at ${ERC721BeaconAddr}`);
    else deployERC721Beacon = await proxy.connect(otherSigner).cloneDeterministic(beaconAddr, salt, ERC721BeaconData);

    if ((await web3.eth.getCode(ERC1155BeaconAddr)) != '0x')
        console.log(`erc1155 beacon already deployed on ${network.name} at ${ERC1155BeaconAddr}`);
    else deployERC1155Beacon = await proxy.connect(otherSigner).cloneDeterministic(beaconAddr, salt, ERC1155BeaconData);

    if ((await web3.eth.getCode(crafterTransferBeaconAddr)) != '0x')
        console.log(`crafterTransfer beacon already deployed on ${network.name} at ${crafterTransferBeaconAddr}`);
    else
        deployCrafterTransferBeacon = await proxy
            .connect(otherSigner)
            .cloneDeterministic(beaconAddr, salt, crafterTransferBeaconData);

    if (deployERC721Beacon !== undefined) ERC721BeaconTx = await deployERC721Beacon.wait();
    if (deployERC1155Beacon !== undefined) ERC1155BeaconTx = await deployERC1155Beacon.wait();
    if (deployCrafterTransferBeacon !== undefined) crafterTransferBeaconTx = await deployCrafterTransferBeacon.wait();

    console.log();
    if (ERC721BeaconTx) console.log(`ERC721 beacon deployed to ${ERC721BeaconAddr} with ${ERC721BeaconTx.gasUsed} gas`);
    if (ERC1155BeaconTx)
        console.log(`ERC1155 beacon deployed to ${ERC1155BeaconAddr} with ${ERC1155BeaconTx.gasUsed} gas`);
    if (crafterTransferBeaconTx)
        console.log(
            `CrafterTransfer beacon deployed to ${crafterTransferBeaconAddr} with ${crafterTransferBeaconTx.gasUsed} gas`,
        );
};

export default deploy;
deploy.tags = ['Beacons'];
deploy.dependencies = [
    'CrafterTransferImpl',
    'CrafterMintImpl',
    'BeaconImpl',
    'ProxyFactory',
    'ERC721Impl',
    'ERC1155Impl',
];
