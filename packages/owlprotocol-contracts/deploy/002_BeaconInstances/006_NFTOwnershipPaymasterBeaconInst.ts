import { HardhatRuntimeEnvironment } from 'hardhat/types';
import { DeployFunction } from 'hardhat-deploy/types';
import { ethers, web3, network } from 'hardhat';
import { ERC1167Factory, UpgradeableBeaconInitializable } from '../../typechain';

const salt = ethers.utils.formatBytes32String('1');

let NFTOwnershipPaymasterBeaconAddr = '';

const deploy: DeployFunction = async function (hre: HardhatRuntimeEnvironment) {
    const { deployments, getNamedAccounts } = hre;

    if (process.env.PROXY_PRIV_KEY === undefined) return;

    const { other } = await getNamedAccounts();

    const otherSigner = (await ethers.getSigners())[1];

    const { address: proxyAddr } = await deployments.get('ERC1167Factory');
    const { address: beaconAddr } = await deployments.get('UpgradeableBeaconInitializable');
    const { address: NFTOwnershipPaymasterAddr } = await deployments.get('NFTOwnershipPaymaster');

    const proxy = (await ethers.getContractAt('ERC1167Factory', proxyAddr)) as ERC1167Factory;
    const beacon = (await ethers.getContractAt(
        'UpgradeableBeaconInitializable',
        beaconAddr,
    )) as UpgradeableBeaconInitializable;

    const NFTOwnershipPaymasterBeaconData = beacon.interface.encodeFunctionData('initialize', [
        other,
        NFTOwnershipPaymasterAddr,
    ]);

    if (network.name === 'hardhat') {
        NFTOwnershipPaymasterBeaconAddr = await proxy
            .connect(otherSigner)
            .predictDeterministicAddress(beaconAddr, salt, NFTOwnershipPaymasterBeaconData);
    }

    let deployNFTOwnershipPaymasterBeacon;
    let NFTOwnershipPaymasterBeaconTx;

    if ((await web3.eth.getCode(NFTOwnershipPaymasterBeaconAddr)) != '0x')
        console.log(
            `NFTOwnershipPaymaster beacon already deployed on ${network.name} at ${NFTOwnershipPaymasterBeaconAddr}`,
        );
    else
        deployNFTOwnershipPaymasterBeacon = await proxy
            .connect(otherSigner)
            .cloneDeterministic(beaconAddr, salt, NFTOwnershipPaymasterBeaconData);

    if (deployNFTOwnershipPaymasterBeacon !== undefined)
        NFTOwnershipPaymasterBeaconTx = await deployNFTOwnershipPaymasterBeacon.wait();

    if (NFTOwnershipPaymasterBeaconTx)
        console.log(
            `NFTOwnershipPaymaster beacon deployed to ${NFTOwnershipPaymasterBeaconAddr} with ${NFTOwnershipPaymasterBeaconTx.gasUsed} gas`,
        );
};

export default deploy;
deploy.tags = ['NFTOwnershipPaymasterBeacon', 'NFTOwnershipPaymaster', 'Beacons'];
deploy.dependencies = ['NFTOwnershipPaymasterImpl', 'BeaconImpl', 'ProxyFactory'];
