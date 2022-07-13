import { assert, expect } from 'chai';
import { GsnTestEnvironment, TestEnvironment } from '@opengsn/cli/dist/GsnTestEnvironment';
import { ethers } from 'hardhat'; //HH-connected ethers
import { ERC721Owl, ERC721Owl__factory, ERC1167Factory, ERC1167Factory__factory } from '../../typechain';
import { SignerWithAddress } from '@nomiclabs/hardhat-ethers/signers';
import { deployClone } from '../utils';
import { Web3Provider } from '@ethersproject/providers';

const salt = ethers.utils.formatBytes32String('1');

describe('ERC721Owl', () => {
    let ERC721OwlFactory: ERC721Owl__factory;
    let ERC721OwlImplementation: ERC721Owl;
    let Owl: ERC721Owl;

    let signer2: SignerWithAddress; //owner after mint

    let gsnForwarderAddress = '0x0000000000000000000000000000000000000001';

    let ERC1167FactoryFactory: ERC1167Factory__factory;
    let ERC1167Factory: ERC1167Factory;

    let gsn: TestEnvironment;
    let web3provider: Web3Provider;

    //Run GSN Tests here
    //Use account1 as account0 is used as relayer
    //Use Web3.js as better suited for provider
    before(async () => {
        //Setup Test Environment
        gsn = await GsnTestEnvironment.startGsn('http://localhost:8545');
        const provider = gsn.relayProvider;

        //@ts-ignore
        web3provider = new ethers.providers.Web3Provider(provider);
        gsnForwarderAddress = gsn.contractsDeployment.forwarderAddress as string;

        signer2 = (await ethers.getSigners())[1];

        // Contract deployment
        ERC721OwlFactory = (await ethers.getContractFactory('ERC721Owl')) as ERC721Owl__factory;
        ERC721OwlImplementation = await ERC721OwlFactory.connect(signer2).deploy();

        ERC1167FactoryFactory = (await ethers.getContractFactory('ERC1167Factory')) as ERC1167Factory__factory;
        ERC1167Factory = await ERC1167FactoryFactory.connect(signer2).deploy();
        const { address } = await deployClone(
            ERC721OwlImplementation,
            [signer2.address, 'n', 's', 'u', gsnForwarderAddress],
            ERC1167Factory,
            salt,
            'initialize(address,string,string,string,address)', // must use full signature
            signer2,
        );
        Owl = (await ethers.getContractAt('ERC721Owl', address)) as ERC721Owl;
    });

    after(() => {
        //Disconnect from relayer
        gsn.relayProvider.disconnect();
    });

    describe('Regular (no gsn)', () => {
        it('mint()', async () => {
            const initialBalance = await ethers.provider.getBalance(signer2.address);

            await Owl.connect(signer2).mint(signer2.address, 1);
            const exists = await Owl.exists(1);

            assert.equal(exists, true, 'Token not minted!');

            //Gas was spent by user
            const finalBalance = await ethers.provider.getBalance(signer2.address);
            assert.isTrue(finalBalance.lt(initialBalance), 'finalBalance !< initialBalance');
        });
    });

    describe('GSN', () => {
        let OwlGSNContract: ERC721Owl;

        before(async () => {
            //Setup GSN-connected contract
            OwlGSNContract = Owl.connect(web3provider.getSigner(signer2.address));
        });

        it('mint()', async () => {
            const initialBalance = await ethers.provider.getBalance(signer2.address);

            await OwlGSNContract.mint(signer2.address, '2', { gasLimit: 1e6 });

            // Ensure exists
            const exists = await OwlGSNContract.exists('2');
            assert.equal(exists, true, 'Token not minted!');

            // No gas was spent by user
            const finalBalance = await ethers.provider.getBalance(signer2.address);
            expect(finalBalance).to.equal(initialBalance);
        });
    });
});
