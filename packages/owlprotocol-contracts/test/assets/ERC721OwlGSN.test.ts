import { assert } from 'chai';
import { GsnTestEnvironment, TestEnvironment } from '@opengsn/cli/dist/GsnTestEnvironment';
import Web3 from 'web3';
import type { Contract as Web3Contract } from 'web3-eth-contract';
import { ethers } from 'hardhat'; //HH-connected ethers
import ERC721OwlGSNArtifact from '../../artifacts/contracts/assets/ERC721/ERC721OwlGSN.sol/ERC721OwlGSN.json';
import { ERC721OwlGSN, ERC721OwlGSN__factory, ERC1167Factory, ERC1167Factory__factory } from '../../typechain';
import { SignerWithAddress } from '@nomiclabs/hardhat-ethers/signers';
import { HttpProvider } from 'web3-core';
import { deployClone } from '../utils';

const salt = ethers.utils.formatBytes32String('1');

describe.only('ERC721OwlGSN', () => {
    let ERC721OwlGSNFactory: ERC721OwlGSN__factory;
    let OwlGSN: ERC721OwlGSN;

    let signer1: SignerWithAddress; //original owner of ERC721Owl
    let signer2: SignerWithAddress; //owner after mint

    let gsnForwarderAddress = '0x0000000000000000000000000000000000000001';

    let ERC1167FactoryFactory: ERC1167Factory__factory;
    let ERC1167Factory: ERC1167Factory;

    beforeEach(async () => {
        [signer1, signer2] = await ethers.getSigners();
        const ERC721OwlGSNFactory = (await ethers.getContractFactory('ERC721OwlGSN')) as ERC721OwlGSN__factory;
        const ERC721OwlGSN = await ERC721OwlGSNFactory.deploy();

        ERC1167FactoryFactory = (await ethers.getContractFactory('ERC1167Factory')) as ERC1167Factory__factory;
        ERC1167Factory = await ERC1167FactoryFactory.deploy();
        const { address } = await deployClone(
            ERC721OwlGSN,
            [signer1.address, 'n', 's', 'u', gsnForwarderAddress],
            ERC1167Factory,
            salt,
            'initialize(address,string,string,string,address)',
        );
        OwlGSN = (await ethers.getContractAt('ERC721OwlGSN', address)) as ERC721OwlGSN;
    });

    describe('Regular', () => {
        it('mint()', async () => {
            const initialBalance = await ethers.provider.getBalance(signer1.address);

            await OwlGSN.mint(signer2.address, 1);
            const exists = await OwlGSN.exists(1);

            assert.equal(exists, true, 'Token not minted!');

            //Gas was spent by user
            const finalBalance = await ethers.provider.getBalance(signer1.address);
            assert.isTrue(finalBalance.lt(initialBalance), 'finalBalance !< initialBalance');
        });
    });

    describe('GSN', () => {
        let gsn: TestEnvironment;
        let gsnProvider: HttpProvider;
        let web3: Web3;

        let OwlGSNContract: Web3Contract;

        //Run GSN Tests here
        //Use account1 as account0 is used as relayer
        //Use Web3.js as better suited for provider
        before(async () => {
            //Setup Test Environment
            gsn = await GsnTestEnvironment.startGsn('http://localhost:8545');
            //@ts-ignore
            gsnProvider = gsn.relayProvider;
            web3 = new Web3(gsnProvider);
            gsnForwarderAddress = gsn.contractsDeployment.forwarderAddress as string;

            //Set forwarder --> don't need if we are passing in as an initializer?
            //await OwlGSN.setTrustedForwarder(gsnForwarderAddress);

            //Setup GSN-connected contract
            OwlGSNContract = new web3.eth.Contract(ERC721OwlGSNArtifact.abi as any, OwlGSN.address);
        });

        after(() => {
            //Disconnect from relayer
            gsn.relayProvider.disconnect();
        });

        it('mint()', async () => {
            const initialBalance = await ethers.provider.getBalance(signer1.address);

            await OwlGSNContract.methods.mint(signer2.address, 1).send({ from: signer1.address });
            // const exists = await OwlGSNContract.methods.exists(1).call();

            // assert.equal(exists, true, 'Token not minted!');

            // //No gas was spent by user
            // const finalBalance = await ethers.provider.getBalance(signer1.address);
            // assert.isTrue(finalBalance.eq(initialBalance), 'finalBalance != initialBalance');
        });

        /*
        //Run GSN Tests here
        //Use account1 as account0 is used as relayer
        before(async () => {
            //Setup Test Environment
            gsn = await GsnTestEnvironment.startGsn('http://localhost:8545');
            //@ts-ignore
            gsnProvider = new ethers.providers.Web3Provider(gsn.relayProvider);
            const pkey = '0x8253ed8da24264bd06df0281196eb8ce86f42878172d0caf178cfd9e01808761'
            gsnSigner = new ethers.Wallet(pkey, gsnProvider)
            gsnForwarderAddress = gsn.contractsDeployment.forwarderAddress as string;
            //Set forwarder
            await Flag.setTrustedForwarder(gsnForwarderAddress);
            //Setup GSN-connected contract
            FlagGSN = new ethers.Contract(Flag.address, Flag.interface, gsnSigner) as CaptureTheFlag
        })
        after(() => {
            //Disconnect from relayer
            gsn.relayProvider.disconnect();
        });
        it('captureFlag()', async () => {
            const initialBalance = await ethersHH.provider.getBalance(accounts[2].address);
            await FlagGSN.captureFlag({ from: accounts[2].address });
            const holder = await FlagGSN.flagHolder()
            assert.equal(holder, accounts[2].address, 'Flag not captured!')
            //No gas was spent by user
            const finalBalance = await ethersHH.provider.getBalance(accounts[2].address);
            console.debug(initialBalance.toString())
            console.debug(finalBalance.toString())
            assert.isTrue(finalBalance.eq(initialBalance), 'finalBalance != initialBalance');
        });
    })
    */
    });
});
