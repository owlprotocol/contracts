import { SignerWithAddress } from '@nomiclabs/hardhat-ethers/signers';
import { expect } from 'chai';
import { hexZeroPad, keccak256, solidityPack } from 'ethers/lib/utils';
import { ethers } from 'hardhat';
import { pick } from 'lodash';
import { ERC1167Factory, ERC1167Factory__factory, ERC721Owl, ERC721Owl__factory } from '../../../typechain';


describe('ERC1167Factory', () => {

    const saltBytes = ethers.utils.formatBytes32String('1');

    let signer1: SignerWithAddress

    let ERC1167FactoryFactory: ERC1167Factory__factory
    let ERC1167Factory: ERC1167Factory

    beforeEach(async () => {
        ERC1167FactoryFactory = (await ethers.getContractFactory("ERC1167Factory")) as ERC1167Factory__factory;
        ERC1167Factory = (await ERC1167FactoryFactory.deploy()) as ERC1167Factory
    })

    it('clone()', async () => {

        [signer1] = await ethers.getSigners()

        const name = 'n'
        const symbol = 's'
        const uri = 'u'

        const ERC721Factory = (await ethers.getContractFactory("ERC721Owl")) as ERC721Owl__factory
        const ERC721Impl = (await ERC721Factory.deploy()) as ERC721Owl

        const tx1 = await ERC1167Factory.clone(ERC721Impl.address, '0x')
        const receipt1 = await tx1.wait();
        const { events: events1 } = receipt1

        expect(events1).to.not.equal(undefined)
        if (events1 === undefined) return;

        const { instance: instance1 } = pick(events1[0].args, ['instance', 'implementation', 'salt'])

        const contrInst1 = (await ethers.getContractAt("ERC721Owl", instance1)) as ERC721Owl

        expect(await contrInst1.name()).to.equal('')
        expect(await contrInst1.symbol()).to.equal('')
        expect(await contrInst1.baseURI()).to.equal('')

        const tx2 = await ERC1167Factory.clone(ERC721Impl.address, ERC721Impl.interface.encodeFunctionData('initialize', [
            ethers.constants.AddressZero,
            name,
            symbol,
            uri,
            ethers.constants.AddressZero,
            signer1.address,
            0
        ]))
        const receipt2 = await tx2.wait();
        const { events: events2 } = receipt2

        expect(events2).to.not.equal(undefined)
        if (events2 === undefined) return;

        const { instance: instance2, implementation, salt } = pick(events2[6].args, ['instance', 'implementation', 'salt'])

        expect(implementation).to.equal(ERC721Impl.address)
        expect(salt).to.equal(hexZeroPad("0x00", 32));

        const contrInst2 = (await ethers.getContractAt("ERC721Owl", instance2)) as ERC721Owl


        expect(await contrInst2.name()).to.equal(name);
        expect(await contrInst2.symbol()).to.equal(symbol);
        expect(await contrInst2.baseURI()).to.equal(uri);
    })

    it('cloneDeterministic', async () => {
        const name = 'n'
        const symbol = 's'
        const uri = 'u'

        const ERC721Factory = (await ethers.getContractFactory("ERC721Owl")) as ERC721Owl__factory
        const ERC721Impl = (await ERC721Factory.deploy()) as ERC721Owl

        const tx1 = await ERC1167Factory.cloneDeterministic(ERC721Impl.address, saltBytes, '0x')
        const receipt1 = await tx1.wait();
        const { events: events1 } = receipt1

        expect(events1).to.not.equal(undefined)
        if (events1 === undefined) return;

        const { instance: instance1 } = pick(events1[0].args, ['instance', 'implementation', 'salt'])

        const contrInst1 = (await ethers.getContractAt("ERC721Owl", instance1)) as ERC721Owl

        expect(await contrInst1.name()).to.equal('')
        expect(await contrInst1.symbol()).to.equal('')
        expect(await contrInst1.baseURI()).to.equal('')

        const data = ERC721Impl.interface.encodeFunctionData('initialize', [
            ethers.constants.AddressZero,
            name,
            symbol,
            uri,
            ethers.constants.AddressZero,
            signer1.address,
            0
        ])


        const tx2 = await ERC1167Factory.cloneDeterministic(ERC721Impl.address, saltBytes, data)
        const receipt2 = await tx2.wait();
        const { events: events2 } = receipt2

        expect(events2).to.not.equal(undefined)
        if (events2 === undefined) return;

        const { instance: instance2, implementation } = pick(events2[6].args, ['instance', 'implementation'])

        expect(implementation).to.equal(ERC721Impl.address)

        const contrInst2 = (await ethers.getContractAt("ERC721Owl", instance2)) as ERC721Owl


        expect(await contrInst2.name()).to.equal(name);
        expect(await contrInst2.symbol()).to.equal(symbol);
        expect(await contrInst2.baseURI()).to.equal(uri);
    })
})
