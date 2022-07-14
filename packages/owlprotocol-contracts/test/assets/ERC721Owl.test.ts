import { assert, expect } from 'chai';
import { ethers, network } from 'hardhat'; //HH-connected ethers
import { ERC721Owl, ERC721Owl__factory } from '../../typechain';
import { deployCloneWrap } from '../utils';
import { loadEnvironment, TestingSigner, describeNoGSN, describeGSN } from '@owlprotocol/contract-helpers-opengsn/src';

describe('ERC721Owl', () => {
    let ERC721OwlFactory: ERC721Owl__factory;
    let ERC721OwlImplementation: ERC721Owl;
    let Owl: ERC721Owl;

    let signer1: TestingSigner; //owner after mint

    let gsnForwarderAddress = '0x0000000000000000000000000000000000000001';

    //Run GSN Tests here
    //Use account1 as account0 is used as relayer
    //Use Web3.js as better suited for provider
    before(async () => {
        //Setup Test Environment
        ({ signer1, gsnForwarderAddress } = await loadEnvironment(ethers, network));

        // Contract deployment
        ERC721OwlFactory = (await ethers.getContractFactory('ERC721Owl')) as ERC721Owl__factory;
        ERC721OwlImplementation = await ERC721OwlFactory.deploy();

        Owl = (
            await deployCloneWrap(
                ERC721OwlImplementation,
                [signer1.address, 'n', 's', 'u', gsnForwarderAddress],
                undefined,
                undefined,
                'initialize(address,string,string,string,address)', // must use full signature
                signer1,
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
});
