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
import { deployClone } from '../utils';
import { expect } from 'chai';

describe('BeaconProxy and Beacon use and upgrade through EIP1167 Proxy', async () => {
    let owlAdmin: SignerWithAddress;
    let gameDev: SignerWithAddress;
    let forwarder: SignerWithAddress;

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
        [owlAdmin, gameDev, forwarder] = await ethers.getSigners();
    });

    it('deployment', async () => {
        //Deploy Beacon Instance with ProxyFactory
        const { address: beaconAddr } = await deployClone(
            Beacon,
            [owlAdmin.address, ERC721Owl.address],
            ERC1167Factory,
        );
        const { address: beaconAddr2 } = await deployClone(
            Beacon,
            [owlAdmin.address, ERC721Owl.address],
            ERC1167Factory,
            ethers.utils.formatBytes32String('2'),
        );

        //Deploy BeaconProxy Instance with ProxyFactory
        //@ts-ignore
        const ERC721Data = ERC721Owl.interface.encodeFunctionData('proxyInitialize', [
            owlAdmin.address,
            'CryptoOwls',
            'OWL',
            'https://api.istio.owlprotocol.xyz/metadata/getMetadata/QmcunXcWbn2fZ7UyNXC954AVEz1uoPA4MbbgHwg6z52PAM/',
            forwarder.address,
        ]);
        const { address: beaconProxyAddr } = await deployClone(
            BeaconProxy,
            [gameDev.address, beaconAddr, ERC721Data],
            ERC1167Factory,
        );

        const beaconProxyInst = (await ethers.getContractAt(
            'BeaconProxyInitializable',
            beaconProxyAddr,
        )) as BeaconProxyInitializable;

        // await owlAdmin.sendTransaction({
        //     to: beaconProxyInst.address,
        //     value: ethers.utils.parseEther("1.0"),
        //     gasLimit: 100000
        // })

        // expect(await ethers.provider.getBalance(beaconProxyInst.address)).to.equal(ethers.utils.parseEther("1.0"))

        expect(await beaconProxyInst.beacon()).to.equal(beaconAddr);

        await beaconProxyInst.connect(gameDev).setBeacon(beaconAddr2, '0x');
        expect(await beaconProxyInst.beacon()).to.equal(beaconAddr2);
    });

    it('upgrade beacon', async () => {
        const { address } = await deployClone(Beacon, [owlAdmin.address, ERC721Owl.address], ERC1167Factory);

        const beaconInst = (await ethers.getContractAt(
            'UpgradeableBeaconInitializable',
            address,
        )) as UpgradeableBeaconInitializable;

        const ERC721OwlV2 = await ERC721OwlFactory.deploy();
        await ERC721OwlV2.deployed();

        await beaconInst.upgradeTo(ERC721OwlV2.address);
        expect(await beaconInst.implementation()).to.equal(ERC721OwlV2.address);

        await expect(beaconInst.upgradeTo(owlAdmin.address)).to.be.revertedWith(
            'UpgradeableBeacon: implementation is not a contract',
        );
    });

});
