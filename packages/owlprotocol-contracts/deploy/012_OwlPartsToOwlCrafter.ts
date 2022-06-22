import { SignerWithAddress } from '@nomiclabs/hardhat-ethers/signers';
import { ethers, network } from 'hardhat';
import { DeployFunction } from 'hardhat-deploy/types';
import { HardhatRuntimeEnvironment } from 'hardhat/types';
import {
    BeaconProxyInitializable,
    CrafterTransfer,
    ERC1155Owl,
    ERC1167Factory,
    ERC721Owl,
    UpgradeableBeaconInitializable,
} from '../typechain';
import { ERC721BeaconInstAddr, ERC1155BeaconInstAddr, crafterTransferBeaconInstAddr } from './000_constants';
import { tokenIds } from '../constants';

const ERC1115Amounts = [2, 2, 2, 1, 1, 1, 2];
const ERC1155Ids = [0, 1, 2, 3, 4, 5, 6];

const salt = ethers.utils.formatBytes32String('1');
let ERC721BeaconAddr = ERC721BeaconInstAddr;
let ERC1155BeaconAddr = ERC1155BeaconInstAddr;
let crafterTransferBeaconAddr = crafterTransferBeaconInstAddr;

const deploy: DeployFunction = async function (hre: HardhatRuntimeEnvironment) {
    const { deployments, getNamedAccounts } = hre;

    if (process.env.PRIV_KEY === undefined) return;

    const { other } = await getNamedAccounts();

    const otherSigner = (await ethers.getSigners())[1];

    const { address: proxyAddr } = await deployments.get('ERC1167Factory');
    const { address: beaconProxyAddr } = await deployments.get('BeaconProxyInitializable');
    const { address: beaconAddr } = await deployments.get('UpgradeableBeaconInitializable');
    const { address: ERC721Addr } = await deployments.get('ERC721Owl');
    const { address: ERC1155Addr } = await deployments.get('ERC1155Owl');
    const { address: crafterTransferAddr } = await deployments.get('CrafterTransfer');

    const proxy = (await ethers.getContractAt('ERC1167Factory', proxyAddr)) as ERC1167Factory;

    const beaconProxy = (await ethers.getContractAt(
        'BeaconProxyInitializable',
        beaconProxyAddr,
    )) as BeaconProxyInitializable;

    const beacon = (await ethers.getContractAt(
        'UpgradeableBeaconInitializable',
        beaconAddr,
    )) as UpgradeableBeaconInitializable;

    const crafterTransfer = (await ethers.getContractAt('CrafterTransfer', crafterTransferAddr)) as CrafterTransfer;

    if (network.name === 'hardhat') {
        ERC721BeaconAddr = await getERC721BeaconAddr(beacon, proxy, otherSigner, beaconAddr, ERC721Addr);
        ERC1155BeaconAddr = await getERC1155BeaconAddr(beacon, proxy, otherSigner, beaconAddr, ERC1155Addr);
        crafterTransferBeaconAddr = await getCrafterTransferBeaconAddr(
            beacon,
            proxy,
            otherSigner,
            beaconAddr,
            crafterTransferAddr,
        );
    }

    //Calculate ERC721 instance address
    const ERC721Impl = (await ethers.getContractAt('ERC721Owl', ERC721Addr)) as ERC721Owl;
    const ERC721Data = ERC721Impl.interface.encodeFunctionData('proxyInitialize', [
        other,
        'CryptoOwls',
        'OWL',
        'https://api.istio.owlprotocol.xyz/metadata/getMetadata/QmcunXcWbn2fZ7UyNXC954AVEz1uoPA4MbbgHwg6z52PAM/',
    ]);
    const ERC721BeaconProxyData = beaconProxy.interface.encodeFunctionData('initialize', [
        other,
        ERC721BeaconAddr,
        ERC721Data,
    ]);
    const ERC721BPInstAddr = await proxy
        .connect(otherSigner)
        .predictDeterministicAddress(beaconProxyAddr, salt, ERC721BeaconProxyData);

    const ERC721Inst = (await ethers.getContractAt('ERC721Owl', ERC721BPInstAddr)) as ERC721Owl;

    //Calculate ERC1155 instance address
    const ERC1155Impl = (await ethers.getContractAt('ERC1155Owl', ERC1155Addr)) as ERC1155Owl;
    const ERC1155Data = ERC1155Impl.interface.encodeFunctionData('proxyInitialize', [
        other,
        'ipfs://QmaWCmXshn6Tk81hpape3kCvTgpjkTQAnDamVuHeY46Tnu/{id}.json',
    ]);
    const ERC1155BeaconProxyData = beaconProxy.interface.encodeFunctionData('initialize', [
        other,
        ERC1155BeaconAddr,
        ERC1155Data,
    ]);

    const ERC1155BPInstAddr = await proxy
        .connect(otherSigner)
        .predictDeterministicAddress(beaconProxyAddr, salt, ERC1155BeaconProxyData);

    const ERC1155Inst = (await ethers.getContractAt('ERC1155Owl', ERC1155BPInstAddr)) as ERC1155Owl;

    //DEPLOY CRAFTER TRANSFER
    const crafterTransferData = crafterTransfer.interface.encodeFunctionData('proxyInitialize', [
        other,
        other,
        53,
        [
            {
                token: 2,
                consumableType: 1,
                contractAddr: ERC1155BPInstAddr,
                amounts: ERC1115Amounts,
                tokenIds: ERC1155Ids,
            },
        ],
        [
            {
                token: 1,
                consumableType: 0,
                contractAddr: ERC721BPInstAddr,
                amounts: [],
                tokenIds,
            },
        ],
    ]);

    const beaconProxyData = beaconProxy.interface.encodeFunctionData('initialize', [
        other,
        crafterTransferBeaconAddr,
        crafterTransferData,
    ]);

    const crafterTransferBPInstAddr = await proxy
        .connect(otherSigner)
        .predictDeterministicAddress(beaconProxyAddr, salt, beaconProxyData);

    //set approvals
    await ERC721Inst.connect(otherSigner).setApprovalForAll(crafterTransferBPInstAddr, true);
    await ERC1155Inst.connect(otherSigner).setApprovalForAll(crafterTransferBPInstAddr, true);

    const deployCrafterTransfer = await proxy
        .connect(otherSigner)
        .cloneDeterministic(beaconProxyAddr, salt, beaconProxyData);
    const deployReceipt = await deployCrafterTransfer.wait();

    console.log(
        `\nCrafterTransfer beacon proxy deployed to ${crafterTransferBPInstAddr} with ${deployReceipt.gasUsed} gas`,
    );
};

async function getERC721BeaconAddr(
    beacon: UpgradeableBeaconInitializable,
    proxy: ERC1167Factory,
    otherSigner: SignerWithAddress,
    beaconAddr: string,
    ERC721Addr: string,
) {
    const ERC721BeaconData = beacon.interface.encodeFunctionData('initialize', [otherSigner.address, ERC721Addr]);
    const ERC721BeaconInstAddr = await proxy
        .connect(otherSigner)
        .predictDeterministicAddress(beaconAddr, salt, ERC721BeaconData);
    return ERC721BeaconInstAddr;
}

async function getERC1155BeaconAddr(
    beacon: UpgradeableBeaconInitializable,
    proxy: ERC1167Factory,
    otherSigner: SignerWithAddress,
    beaconAddr: string,
    ERC1155Addr: string,
) {
    const ERC1155BeaconData = beacon.interface.encodeFunctionData('initialize', [otherSigner.address, ERC1155Addr]);
    const ERC1155BeaconInstAddr = await proxy
        .connect(otherSigner)
        .predictDeterministicAddress(beaconAddr, salt, ERC1155BeaconData);
    return ERC1155BeaconInstAddr;
}

async function getCrafterTransferBeaconAddr(
    beacon: UpgradeableBeaconInitializable,
    proxy: ERC1167Factory,
    otherSigner: SignerWithAddress,
    beaconAddr: string,
    crafterTransferAddr: string,
) {
    const crafterTransferBeaconData = beacon.interface.encodeFunctionData('initialize', [
        otherSigner.address,
        crafterTransferAddr,
    ]);
    const crafterTransferBeaconInstAddr = await proxy
        .connect(otherSigner)
        .predictDeterministicAddress(beaconAddr, salt, crafterTransferBeaconData);
    return crafterTransferBeaconInstAddr;
}

export default deploy;
deploy.tags = ['CrafterTransferInst', 'CrafterTransfer', 'BeaconProxy', 'Instance'];
deploy.dependencies = ['BeaconImpl', 'ERC721Impl', 'ERC1155Impl', 'CrafterTransferImpl', 'BeaconProxyImpl', 'Beacons'];
