import { assert, expect } from 'chai';
import { GsnTestEnvironment, TestEnvironment } from '@opengsn/cli/dist/GsnTestEnvironment';
import Web3 from 'web3';
import type { Contract as Web3Contract } from 'web3-eth-contract';
import { ethers } from 'hardhat'; //HH-connected ethers
import ERC721OwlGSNArtifact from '../../artifacts/contracts/assets/ERC721/ERC721OwlGSN.sol/ERC721OwlGSN.json';
import { ERC721OwlGSN__factory, ERC721OwlGSN, ERC1167Factory, ERC1167Factory__factory } from '../../typechain';
import { SignerWithAddress } from '@nomiclabs/hardhat-ethers/signers';
import { HttpProvider } from 'web3-core';
import { deployClone } from '../utils';

const salt = ethers.utils.formatBytes32String('1');

describe('ERC721OwlGSN', () => {
    let ERC721OwlGSNFactory: ERC721OwlGSN__factory;
    let OwlGSN: ERC721OwlGSN;

    let signer1: SignerWithAddress;
    //let signer2: SignerWithAddress;

    let ERC1167FactoryFactory: ERC1167Factory__factory;
    let ERC1167Factory: ERC1167Factory;

    beforeEach(async () => {
        [signer1] = await ethers.getSigners();
        const ERC721OwlGSNFactory = (await ethers.getContractFactory('ERC721OwlGSN')) as ERC721OwlGSN__Factory;
        const ERC721OwlGSN = await ERC721OwlGSNFactory.deploy();

        ERC1167FactoryFactory = (await ethers.getContractFactory('ERC1167Factory')) as ERC1167Factory__factory;
        ERC1167Factory = await ERC1167FactoryFactory.deploy();
        const { address } = await deployClone(ERC721OwlGSN, [signer1.address, 'n', 's', 'u'], ERC1167Factory, salt);
        OwlGSN = (await ethers.getContractAt('ERC721OwlGSN', address)) as ERC721OwlGSN;
    });

    describe('Regular', () => {
        it('mint()', async () => {
            const initialBalance = await ethers.provider.getBalance(signer1.address);

            await OwlGSN.mint(signer1.address, 1);
            const owner = await OwlGSN.ownerOf(1);

            assert.equal(owner, signer1.address, 'Token not minted!');

            //Gas was spent by user
            const finalBalance = await ethers.provider.getBalance(signer1.address);
            assert.isTrue(finalBalance.lt(initialBalance), 'finalBalance !< initialBalance');
        });
    });

    describe('GSN', () => {
        let gsn: TestEnvironment;
        let gsnProvider: HttpProvider;
        let web3: Web3;
        let gsnForwarderAddress: string;

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

            //Set forwarder
            await OwlGSN.setTrustedForwarder(gsnForwarderAddress);

            //Setup GSN-connected contract
            OwlGSNContract = new web3.eth.Contract(ERC721OwlGSNArtifact.abi as any, OwlGSN.address);
        });

        after(() => {
            //Disconnect from relayer
            gsn.relayProvider.disconnect();
        });

        it('mint()', async () => {
            const initialBalance = await ethers.provider.getBalance(signer1.address);

            await OwlGSNContract.methods.mint(signer1.address, 1).send({ from: signer1.address });
            const owner = await OwlGSNContract.methods.ownerOf(1).call();

            assert.equal(owner, signer1.address, 'Token not minted!');

            //No gas was spent by user
            const finalBalance = await ethers.provider.getBalance(signer1.address);
            assert.isTrue(finalBalance.eq(initialBalance), 'finalBalance != initialBalance');
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
