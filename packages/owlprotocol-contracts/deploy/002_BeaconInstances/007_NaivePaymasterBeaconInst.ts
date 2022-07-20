import { HardhatRuntimeEnvironment } from 'hardhat/types';
import { DeployFunction } from 'hardhat-deploy/types';
import { ethers, web3, network } from 'hardhat';
import { ERC1167Factory, UpgradeableBeaconInitializable } from '../../typechain';

const salt = ethers.utils.formatBytes32String('1');

let NaivePaymasterBeaconAddr = '';

const deploy: DeployFunction = async function (hre: HardhatRuntimeEnvironment) {
    const { deployments, getNamedAccounts } = hre;

    if (process.env.PROXY_PRIV_KEY === undefined) return;

    const { other } = await getNamedAccounts();

    const otherSigner = (await ethers.getSigners())[1];

    const { address: proxyAddr } = await deployments.get('ERC1167Factory');
    const { address: beaconAddr } = await deployments.get('UpgradeableBeaconInitializable');
    const { address: NaivePaymasterAddr } = await deployments.get('NaivePaymaster');

    const proxy = (await ethers.getContractAt('ERC1167Factory', proxyAddr)) as ERC1167Factory;
    const beacon = (await ethers.getContractAt(
        'UpgradeableBeaconInitializable',
        beaconAddr,
    )) as UpgradeableBeaconInitializable;

    const NaivePaymasterBeaconData = beacon.interface.encodeFunctionData('initialize', [other, NaivePaymasterAddr]);

    if (network.name === 'hardhat') {
        NaivePaymasterBeaconAddr = await proxy
            .connect(otherSigner)
            .predictDeterministicAddress(beaconAddr, salt, NaivePaymasterBeaconData);
    }

    let deployNaivePaymasterBeacon;
    let NaivePaymasterBeaconTx;

    if ((await web3.eth.getCode(NaivePaymasterBeaconAddr)) != '0x')
        console.log(`NaivePaymaster beacon already deployed on ${network.name} at ${NaivePaymasterBeaconAddr}`);
    else
        deployNaivePaymasterBeacon = await proxy
            .connect(otherSigner)
            .cloneDeterministic(beaconAddr, salt, NaivePaymasterBeaconData);

    if (deployNaivePaymasterBeacon !== undefined) NaivePaymasterBeaconTx = await deployNaivePaymasterBeacon.wait();

    if (NaivePaymasterBeaconTx)
        console.log(
            `NaivePaymaster beacon deployed to ${NaivePaymasterBeaconAddr} with ${NaivePaymasterBeaconTx.gasUsed} gas`,
        );
};

export default deploy;
deploy.tags = ['NaivePaymasterBeacon', 'NaivePaymaster', 'Beacons'];
deploy.dependencies = ['NaivePaymasterImpl', 'BeaconImpl', 'ProxyFactory'];
