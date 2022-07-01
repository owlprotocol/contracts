import { HardhatRuntimeEnvironment } from 'hardhat/types';
import { DeployFunction } from 'hardhat-deploy/types';
import { ethers, web3, network } from 'hardhat';
import { ERC1167Factory, UpgradeableBeaconInitializable } from '../../typechain';
import { ERC1155BeaconInstAddr } from '../../constants/addresses';

const salt = ethers.utils.formatBytes32String('1');

let ERC1155BeaconAddr = ERC1155BeaconInstAddr;

const deploy: DeployFunction = async function (hre: HardhatRuntimeEnvironment) {
    if (process.env.PROXY_PRIV_KEY === undefined) return;

    const { deployments, getNamedAccounts } = hre;
    const { other } = await getNamedAccounts();
    const otherSigner = (await ethers.getSigners())[1];

    const { address: proxyAddr } = await deployments.get('ERC1167Factory');
    const { address: beaconAddr } = await deployments.get('UpgradeableBeaconInitializable');
    const { address: ERC1155Addr } = await deployments.get('ERC1155Owl');

    const proxy = (await ethers.getContractAt('ERC1167Factory', proxyAddr)) as ERC1167Factory;
    const beacon = (await ethers.getContractAt(
        'UpgradeableBeaconInitializable',
        beaconAddr,
    )) as UpgradeableBeaconInitializable;

    const ERC1155BeaconData = beacon.interface.encodeFunctionData('initialize', [other, ERC1155Addr]);

    if (network.name === 'hardhat') {
        ERC1155BeaconAddr = await proxy
            .connect(otherSigner)
            .predictDeterministicAddress(beaconAddr, salt, ERC1155BeaconData);
    }

    let deployERC1155Beacon;
    let ERC1155BeaconTx;

    if ((await web3.eth.getCode(ERC1155BeaconAddr)) != '0x')
        console.log(`erc1155 beacon already deployed on ${network.name} at ${ERC1155BeaconAddr}`);
    else deployERC1155Beacon = await proxy.connect(otherSigner).cloneDeterministic(beaconAddr, salt, ERC1155BeaconData);

    if (deployERC1155Beacon !== undefined) ERC1155BeaconTx = await deployERC1155Beacon.wait();

    if (ERC1155BeaconTx)
        console.log(`ERC1155 beacon deployed to ${ERC1155BeaconAddr} with ${ERC1155BeaconTx.gasUsed} gas`);
};

export default deploy;
deploy.tags = ['ERC1155Beacon', 'ERC1155', 'Beacons'];
deploy.dependencies = ['ERC1155Impl', 'BeaconImpl', 'ProxyFactory'];
