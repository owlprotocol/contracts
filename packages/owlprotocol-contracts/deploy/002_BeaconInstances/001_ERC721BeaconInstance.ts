import { HardhatRuntimeEnvironment } from 'hardhat/types';
import { DeployFunction } from 'hardhat-deploy/types';
import { ethers, web3, network } from 'hardhat';
import { ERC1167Factory, UpgradeableBeaconInitializable } from '../../typechain';
import { ERC721BeaconInstAddr } from '../../constants/addresses';

const salt = ethers.utils.formatBytes32String('1');

let ERC721BeaconAddr = ERC721BeaconInstAddr;

const deploy: DeployFunction = async function (hre: HardhatRuntimeEnvironment) {
    if (process.env.PROXY_PRIV_KEY === undefined) return;

    const { deployments, getNamedAccounts } = hre;
    const { other } = await getNamedAccounts();
    const otherSigner = (await ethers.getSigners())[1];

    const { address: proxyAddr } = await deployments.get('ERC1167Factory');
    const { address: beaconAddr } = await deployments.get('UpgradeableBeaconInitializable');
    const { address: ERC721Addr } = await deployments.get('ERC721Owl');

    const proxy = (await ethers.getContractAt('ERC1167Factory', proxyAddr)) as ERC1167Factory;
    const beacon = (await ethers.getContractAt(
        'UpgradeableBeaconInitializable',
        beaconAddr,
    )) as UpgradeableBeaconInitializable;

    const ERC721BeaconData = beacon.interface.encodeFunctionData('initialize', [other, ERC721Addr]);

    if (network.name === 'hardhat') {
        ERC721BeaconAddr = await proxy
            .connect(otherSigner)
            .predictDeterministicAddress(beaconAddr, salt, ERC721BeaconData);
    }

    let deployERC721Beacon;
    let ERC721BeaconTx;

    if ((await web3.eth.getCode(ERC721BeaconAddr)) != '0x')
        console.log(`erc721 beacon already deployed on ${network.name} at ${ERC721BeaconAddr}`);
    else deployERC721Beacon = await proxy.connect(otherSigner).cloneDeterministic(beaconAddr, salt, ERC721BeaconData);

    if (deployERC721Beacon !== undefined) ERC721BeaconTx = await deployERC721Beacon.wait();

    console.log();
    if (ERC721BeaconTx) console.log(`ERC721 beacon deployed to ${ERC721BeaconAddr} with ${ERC721BeaconTx.gasUsed} gas`);
};

export default deploy;
deploy.tags = ['ERC721Beacon', 'ERC721', 'Beacons'];
deploy.dependencies = ['BeaconImpl', 'ERC721Impl', 'ProxyFactory'];
