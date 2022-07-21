import { assert, expect } from 'chai';
import { ethers, network } from 'hardhat'; //HH-connected ethers
const { utils } = ethers
const { keccak256, toUtf8Bytes } = utils
import { ERC721Owl, ERC721Owl__factory } from '../../../typechain';
import { deployCloneWrap } from '../utils';
import { loadEnvironment, TestingSigner, describeNoGSN, describeGSN } from '@owlprotocol/contract-helpers-opengsn/src';
import { SignerWithAddress } from '@nomiclabs/hardhat-ethers/signers';

describe('ERC721Owl', () => {
    let ERC721OwlFactory: ERC721Owl__factory;
    let ERC721OwlImplementation: ERC721Owl;
    let Owl: ERC721Owl;

    let signer1: TestingSigner; //owner after mint

    let signer2: SignerWithAddress;
    let signer3: SignerWithAddress;

    let gsnForwarderAddress = '0x0000000000000000000000000000000000000001';

    //Run GSN Tests here
    //Use account1 as account0 is used as relayer
    //Use Web3.js as better suited for provider
    before(async () => {
        [signer2, signer3] = await ethers.getSigners();

        //Setup Test Environment
        ({ signer1, gsnForwarderAddress } = await loadEnvironment(ethers, network));

        // Contract deployment
        ERC721OwlFactory = (await ethers.getContractFactory('ERC721Owl')) as ERC721Owl__factory;
        ERC721OwlImplementation = await ERC721OwlFactory.deploy();

        Owl = (
            await deployCloneWrap(
                ERC721OwlImplementation,
                [signer1.address, 'n', 's', 'u', gsnForwarderAddress, signer1.address, 0],
                undefined,
                undefined,
                'initialize(address,string,string,string,address,address,uint96)', // must use full signature
                signer1
            )
        ).contract as ERC721Owl;
    });

    describeNoGSN('Regular (no gsn)', () => {
        it('mint()', async () => {
            const initialBalance = await ethers.provider.getBalance(signer1.address);

            await Owl.connect(signer1).mint(signer1.address, 1);
            const exists = await Owl.exists(1);

            assert.equal(exists, true, 'Token not minted!');

            //Gas was spent by user
            const finalBalance = await ethers.provider.getBalance(signer1.address);
            assert.isTrue(finalBalance.lt(initialBalance), 'finalBalance !< initialBalance');
        });
    });

    describeGSN('GSN', () => {
        it('mint()', async () => {
            const initialBalance = await ethers.provider.getBalance(signer1.address);

            await Owl.mint(signer1.address, '2', { gasLimit: 1e6 });

            // Ensure exists
            const exists = await Owl.exists('2');
            assert.equal(exists, true, 'Token not minted!');

            // No gas was spent by user
            const finalBalance = await ethers.provider.getBalance(signer1.address);
            // Will fail if not running GSN
            expect(finalBalance).to.equal(initialBalance);
        });
    });

    it('uri role', async () => {
        const newURI = 'newuri'

        await expect(Owl.connect(signer3).setBaseURI(newURI)).to.be.revertedWith(`AccessControl: account ${signer3.address.toLowerCase()} is missing role ${keccak256(
            toUtf8Bytes('URI_ROLE'),
        )}`)

        await Owl.connect(signer2).grantUriRole(signer3.address);


        await Owl.connect(signer3).setBaseURI(newURI);

        expect(await Owl.baseURI()).to.equal(newURI)
        expect(await Owl.contractURI()).to.equal((await Owl.baseURI()).toString() + 'metadata.json')
    })

    it('safeMint()', async () => {
        await Owl.safeMint(signer2.address, 15);
        expect(await Owl.ownerOf(15)).to.equal(signer2.address)
    })

});
