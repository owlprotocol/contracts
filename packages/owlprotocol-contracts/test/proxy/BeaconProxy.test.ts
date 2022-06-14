import { ethers } from 'hardhat';
import { SignerWithAddress } from '@nomiclabs/hardhat-ethers/signers';
import {
    ERC1167Factory__factory,
    ERC1167Factory,
    BeaconProxyInitializable__factory,
    BeaconProxyInitializable,
    UpgradeableBeaconInitializable__factory,
    UpgradeableBeaconInitializable,
    ERC721Owl__factory,
    ERC721Owl,
} from '../../typechain';

const salt = ethers.utils.formatBytes32String('1');

describe('BeaconProxy and Beacon use and upgrade through EIP1167 Proxy', async () => {
    let owlAdmin: SignerWithAddress;
    let gameDev: SignerWithAddress;

    let ERC1167FactoryFactory: ERC1167Factory__factory;
    let ERC1167Factory: ERC1167Factory;

    let BeaconProxyFactory: BeaconProxyInitializable__factory;
    let BeaconProxy: BeaconProxyInitializable;

    let BeaconFactory: UpgradeableBeaconInitializable__factory;
    let Beacon: UpgradeableBeaconInitializable;

    let ERC721OwlFactory: ERC721Owl__factory;
    let ERC721Owl: ERC721Owl;

    before(async () => {
        // Launch ERC1167 Factory
        ERC1167FactoryFactory = (await ethers.getContractFactory('ERC1167Factory')) as ERC1167Factory__factory;
        ERC1167Factory = await ERC1167FactoryFactory.deploy();
        await ERC1167Factory.deployed();

        //Launch BeaconProxyImpl
        BeaconProxyFactory = (await ethers.getContractFactory(
            'BeaconProxyInitializable',
        )) as BeaconProxyInitializable__factory;
        BeaconProxy = await BeaconProxyFactory.deploy();
        await BeaconProxy.deployed();

        //Launch BeaconImpl
        BeaconFactory = (await ethers.getContractFactory(
            'UpgradeableBeaconInitializable',
        )) as UpgradeableBeaconInitializable__factory;
        Beacon = await BeaconFactory.deploy();
        await Beacon.deployed();

        //Launch ERC721OwlImpl
        ERC721OwlFactory = (await ethers.getContractFactory('ERC721Owl')) as ERC721Owl__factory;
        ERC721Owl = await ERC721OwlFactory.deploy();
        await ERC721Owl.deployed();

        // Get users
        [owlAdmin, gameDev] = await ethers.getSigners();
    });

    it('deployment', async () => {
        //Deploy Beacon Instance with ProxyFactory
        const BeaconData = Beacon.interface.encodeFunctionData('initialize', [owlAdmin.address, ERC721Owl.address]);

        const BeaconInstanceAddress = await ERC1167Factory.predictDeterministicAddress(
            Beacon.address,
            salt,
            BeaconData,
        );

        const deployBeacon = await ERC1167Factory.cloneDeterministic(Beacon.address, salt, BeaconData);
        await deployBeacon.wait();

        const ERC721Data = ERC721Owl.interface.encodeFunctionData('proxyInitialize', [
            owlAdmin.address,
            'CryptoOwls',
            'OWL',
            'https://api.istio.owlprotocol.xyz/metadata/getMetadata/QmcunXcWbn2fZ7UyNXC954AVEz1uoPA4MbbgHwg6z52PAM/',
        ]);

        //Deploy BeaconProxy Instance with ProxyFactory
        const BeaconProxyData = BeaconProxy.interface.encodeFunctionData('initialize', [
            gameDev.address,
            BeaconInstanceAddress,
            ERC721Data,
        ]);

        await ERC1167Factory.predictDeterministicAddress(BeaconProxy.address, salt, BeaconProxyData);

        const deployBeaconProxy = await ERC1167Factory.cloneDeterministic(BeaconProxy.address, salt, BeaconProxyData);
        const receipt = await deployBeaconProxy.wait();
        console.log('gas used: ', receipt.gasUsed.toNumber());
    });
});
