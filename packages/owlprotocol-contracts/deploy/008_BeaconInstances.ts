import { HardhatRuntimeEnvironment } from 'hardhat/types';
import { DeployFunction } from 'hardhat-deploy/types';
import { ethers } from 'hardhat';
import { ERC1167Factory, UpgradeableBeaconInitializable } from '../typechain';

const salt = ethers.utils.formatBytes32String('1');

const deploy: DeployFunction = async function (hre: HardhatRuntimeEnvironment) {
    const { deployments, getNamedAccounts } = hre;
    const { other } = await getNamedAccounts();
    if (process.env.PRIV_KEY === undefined) return;

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

    const ERC721BeaconData = beacon.interface.encodeFunctionData('initialize', [other, ERC721Addr]);
    const ERC1155BeaconData = beacon.interface.encodeFunctionData('initialize', [other, ERC1155Addr]);
    const crafterTransferBeaconData = beacon.interface.encodeFunctionData('initialize', [other, crafterTransferAddr]);

    const ERC721BeaconInstAddr = await proxy.predictDeterministicAddress(beaconAddr, salt, ERC721BeaconData);
    const ERC1155BeaconInstAddr = await proxy.predictDeterministicAddress(beaconAddr, salt, ERC1155BeaconData);
    const crafterTransferBeaconInstAddr = await proxy.predictDeterministicAddress(
        beaconAddr,
        salt,
        crafterTransferBeaconData,
    );

    const deployERC721Beacon = await proxy.cloneDeterministic(beaconAddr, salt, ERC721BeaconData);
    const deployERC1155Beacon = await proxy.cloneDeterministic(beaconAddr, salt, ERC1155BeaconData);
    const deployCrafterTransferBeacon = await proxy.cloneDeterministic(beaconAddr, salt, crafterTransferBeaconData);

    const ERC721BeaconTx = await deployERC721Beacon.wait();
    const ERC1155BeaconTx = await deployERC1155Beacon.wait();
    const crafterTransferBeaconTx = await deployCrafterTransferBeacon.wait();

    console.log();
    console.log(`ERC721 beacon deployed to ${ERC721BeaconInstAddr} with ${ERC721BeaconTx.gasUsed} gas`);
    console.log(`ERC1155 beacon deployed to ${ERC1155BeaconInstAddr} with ${ERC1155BeaconTx.gasUsed} gas`);
    console.log(
        `CrafterTransfer beacon deployed to ${crafterTransferBeaconInstAddr} with ${crafterTransferBeaconTx.gasUsed} gas`,
    );

    // const ERC721Impl = (await ethers.getContractAt('ERC721Owl', ERC721Addr)) as ERC721Owl;
    // const ERC1155Impl = (await ethers.getContractAt('ERC1155Owl', ERC1155Addr)) as ERC1155Owl;
    // const crafterTransferImpl = (await ethers.getContractAt('CrafterTransfer', crafterTransferAddr)) as CrafterTransfer;

    // const ERC721Data = ERC721Impl.interface.encodeFunctionData('initialize', [
    //     other,
    //     'CryptoOwls',
    //     'OWL',
    //     'https://api.istio.owlprotocol.xyz/metadata/getMetadata/QmcunXcWbn2fZ7UyNXC954AVEz1uoPA4MbbgHwg6z52PAM/',
    // ]);
    // const ERC721InstanceAddress = await proxy.predictDeterministicAddress(ERC721Addr, salt, ERC721Data);

    // const ERC1155Data = ERC1155Impl.interface.encodeFunctionData('initialize', [
    //     deployer,
    //     'ipfs://QmaWCmXshn6Tk81hpape3kCvTgpjkTQAnDamVuHeY46Tnu',
    // ]);
    // const ERC1155InstanceAddress = await proxy.predictDeterministicAddress(ERC1155Addr, salt, ERC1155Data);

    // const CrafterTransferData = crafterTransferImpl.interface.encodeFunctionData('initialize', [
    //     other,
    //     other,
    //     0,
    //     [
    //         {
    //             token: 2,
    //             consumableType: 1,
    //             contractAddr: ERC1155InstanceAddress,
    //             amounts: ERC1115Amounts,
    //             tokenIds: ERC1155Ids,
    //         },
    //     ],
    //     [
    //         {
    //             token: 1,
    //             consumableType: 0,
    //             contractAddr: ERC721InstanceAddress,
    //             amounts: [],
    //             tokenIds,
    //         },
    //     ],
    // ]);

    // await proxy.cloneDeterministic(address, salt);
};

export default deploy;
deploy.tags = ['BeaconProxy', 'Beacons'];
