import { HardhatRuntimeEnvironment } from 'hardhat/types';
import { DeployFunction } from 'hardhat-deploy/types';
import { ethers, web3, network } from 'hardhat';
import { ERC1167Factory, UpgradeableBeaconInitializable } from '../../typechain';
import { crafterTransferBeaconInstAddr } from '../../constants/addresses';

const salt = ethers.utils.formatBytes32String('1');

let crafterTransferBeaconAddr = crafterTransferBeaconInstAddr;

const deploy: DeployFunction = async function (hre: HardhatRuntimeEnvironment) {
    if (process.env.PROXY_PRIV_KEY === undefined) return;

    const { deployments, getNamedAccounts } = hre;
    const { other } = await getNamedAccounts();
    const otherSigner = (await ethers.getSigners())[1];

    const { address: proxyAddr } = await deployments.get('ERC1167Factory');
    const { address: beaconAddr } = await deployments.get('UpgradeableBeaconInitializable');
    const { address: crafterTransferAddr } = await deployments.get('CrafterTransfer');

    const proxy = (await ethers.getContractAt('ERC1167Factory', proxyAddr)) as ERC1167Factory;
    const beacon = (await ethers.getContractAt(
        'UpgradeableBeaconInitializable',
        beaconAddr,
    )) as UpgradeableBeaconInitializable;

    const crafterTransferBeaconData = beacon.interface.encodeFunctionData('initialize', [other, crafterTransferAddr]);

    if (network.name === 'hardhat') {
        crafterTransferBeaconAddr = await proxy
            .connect(otherSigner)
            .predictDeterministicAddress(beaconAddr, salt, crafterTransferBeaconData);
    }

    let deployCrafterTransferBeacon;
    let crafterTransferBeaconTx;

    if ((await web3.eth.getCode(crafterTransferBeaconAddr)) != '0x')
        console.log(`crafterTransfer beacon already deployed on ${network.name} at ${crafterTransferBeaconAddr}`);
    else
        deployCrafterTransferBeacon = await proxy
            .connect(otherSigner)
            .cloneDeterministic(beaconAddr, salt, crafterTransferBeaconData);

    if (deployCrafterTransferBeacon !== undefined) crafterTransferBeaconTx = await deployCrafterTransferBeacon.wait();

    if (crafterTransferBeaconTx)
        console.log(
            `CrafterTransfer beacon deployed to ${crafterTransferBeaconAddr} with ${crafterTransferBeaconTx.gasUsed} gas`,
        );
};

export default deploy;
deploy.tags = ['CrafterTransferBeacon', 'CrafterTransfer', 'Beacons'];
deploy.dependencies = ['CrafterTransferImpl', 'BeaconImpl', 'ProxyFactory'];
