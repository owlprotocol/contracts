import { ethers } from "hardhat";
import { expect } from "chai";
import { deployClone } from '../utils';
import { BeaconProxyInitializable, BeaconProxyInitializable__factory, ERC1167Factory, ERC1167Factory__factory, ERC721OwlAttributes, ERC721OwlAttributes__factory, UpgradeableBeaconInitializable, UpgradeableBeaconInitializable__factory } from "../../../typechain";
import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/signers";

const salt = ethers.utils.formatBytes32String('1');

describe('ERC721OwlAttributes.sol', async () => {
    let signer1: SignerWithAddress;
    let signer2: SignerWithAddress;

    let ERC1167FactoryFactory: ERC1167Factory__factory;
    let ERC1167Factory: ERC1167Factory;

    let ERC721OwlAttributesImpl: ERC721OwlAttributes;
    let contrInst: ERC721OwlAttributes;

    const dna = 173;

    let gsnForwarderAddress = '0x0000000000000000000000000000000000000001';

    beforeEach(async () => {

        [signer1, signer2] = await ethers.getSigners();

        const ERC721OwlAttributesFactory = (await ethers.getContractFactory(
            'ERC721OwlAttributes',
        )) as ERC721OwlAttributes__factory;
        ERC721OwlAttributesImpl = await ERC721OwlAttributesFactory.deploy();

        ERC1167FactoryFactory = (await ethers.getContractFactory('ERC1167Factory')) as ERC1167Factory__factory;
        ERC1167Factory = await ERC1167FactoryFactory.deploy();

        const { address } = (
            await deployClone(
                ERC721OwlAttributesImpl,
                [signer1.address, 'n', 's', 'u', gsnForwarderAddress, signer1.address, 0],
                ERC1167Factory,
                salt,
            )
        );

        contrInst = (await ethers.getContractAt("ERC721OwlAttributes", address)) as ERC721OwlAttributes

        await contrInst.safeMint(signer1.address, dna)
    })

    it('tokenURI()', async () => {
        await expect(contrInst.tokenURI(dna)).to.be.revertedWith('ERC721Metadata: URI query for nonexistent token');
        expect(await contrInst.tokenURI(0)).to.equal('u' + dna)
    })

    it('updateDna()', async () => {
        await expect(contrInst.updateDna(dna, 0)).to.be.revertedWith('ERC721Metadata: URI query for nonexistent token');
        await contrInst.updateDna(0, dna)


        await expect(contrInst.getDna(dna)).to.be.revertedWith('ERC721Metadata: URI query for nonexistent token');
        expect(await contrInst.getDna(0)).to.equal(dna)
    })

    it('beacon proxy initialization', async () => {
        const name = 'name';
        const symbol = 'symbol';
        const uri = 'uri';

        const beaconFactory = (await ethers.getContractFactory(
            'UpgradeableBeaconInitializable',
        )) as UpgradeableBeaconInitializable__factory;
        const beaconImpl = (await beaconFactory.deploy()) as UpgradeableBeaconInitializable;

        const beaconProxyFactory = (await ethers.getContractFactory(
            'BeaconProxyInitializable',
        )) as BeaconProxyInitializable__factory;
        const beaconProxyImpl = (await beaconProxyFactory.deploy()) as BeaconProxyInitializable;

        const { address: beaconAddr } = await deployClone(beaconImpl, [signer1.address, ERC721OwlAttributesImpl.address]);
        const data = contrInst.interface.encodeFunctionData('proxyInitialize', [
            signer1.address,
            name,
            symbol,
            uri,
            '0x' + '0'.repeat(40),
            signer1.address, 0
        ]);
        const { address: beaconProxyAddr } = await deployClone(beaconProxyImpl, [signer1.address, beaconAddr, data]);
        contrInst = (await ethers.getContractAt('ERC721OwlAttributes', beaconProxyAddr)) as ERC721OwlAttributes;

        expect(await contrInst.name()).to.equal(name);
        expect(await contrInst.symbol()).to.equal(symbol);
        expect(await contrInst.baseURI()).to.equal(uri);
    });

})
