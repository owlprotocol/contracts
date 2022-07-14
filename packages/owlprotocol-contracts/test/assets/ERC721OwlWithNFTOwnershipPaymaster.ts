import { assert, expect } from 'chai';
import { GsnTestEnvironment, TestEnvironment } from '@opengsn/cli/dist/GsnTestEnvironment';
import { ethers } from 'hardhat'; //HH-connected ethers
import {
    ERC721Owl,
    ERC721Owl__factory,
    ERC1167Factory,
    ERC1167Factory__factory,
    NFTOwnershipPaymaster,
    NFTOwnershipPaymaster__factory,
    ERC721,
} from '../../typechain';
import { SignerWithAddress } from '@nomiclabs/hardhat-ethers/signers';
import { deployClone, createERC721 } from '../utils';
import { Web3Provider } from '@ethersproject/providers';
import { web3 } from 'hardhat';
import { RelayProvider, GSNConfig } from '@opengsn/provider';
import { HttpProvider } from 'web3-core';
import Web3HttpProvider from 'web3-providers-http';

const salt = ethers.utils.formatBytes32String('1');

describe('ERC721Owl With NFTOwnershipPaymaster', () => {
    let ERC721OwlFactory: ERC721Owl__factory;
    let ERC721OwlImplementation: ERC721Owl;

    let ERC1167FactoryFactory: ERC1167Factory__factory;
    let ERC1167Factory: ERC1167Factory;

    let Owl: ERC721Owl;
    let testNFT: ERC721;

    let signer1: SignerWithAddress;
    let signer2: SignerWithAddress; //owner after mint

    let gsn: TestEnvironment;
    let web3provider: Web3Provider;
    let gsnConfig: Partial<GSNConfig>;

    let gsnForwarderAddress = '0x0000000000000000000000000000000000000001';
    let relayHubAddress: string;
    let paymasterAddress: string;

    let NFTPaymaster: NFTOwnershipPaymaster;
    let NFTOwnershipPaymasterFactory: NFTOwnershipPaymaster__factory;

    let etherProvider: Web3Provider;

    //Run GSN Tests here
    //Use account1 as account0 is used as relayer
    //Use Web3.js as better suited for provider
    before(async () => {
        //Setup Test Environment
        gsn = await GsnTestEnvironment.startGsn('http://localhost:8545');
        const provider = gsn.relayProvider;

        //@ts-ignore
        web3provider = new Web3HttpProvider('http://localhost:8545');
        gsnForwarderAddress = gsn.contractsDeployment.forwarderAddress as string;
        relayHubAddress = gsn.contractsDeployment.relayHubAddress as string;
        paymasterAddress = gsn.contractsDeployment.paymasterAddress as string;

        [signer1, signer2] = await ethers.getSigners();

        // Contract deployment
        ERC721OwlFactory = (await ethers.getContractFactory('ERC721Owl')) as ERC721Owl__factory;
        ERC721OwlImplementation = await ERC721OwlFactory.connect(signer1).deploy();

        ERC1167FactoryFactory = (await ethers.getContractFactory('ERC1167Factory')) as ERC1167Factory__factory;
        ERC1167Factory = await ERC1167FactoryFactory.connect(signer1).deploy();
        const { address } = await deployClone(
            ERC721OwlImplementation,
            [signer1.address, 'n', 's', 'u', gsnForwarderAddress],
            ERC1167Factory,
            salt,
            'initialize(address,string,string,string,address)', // must use full signature
            signer1,
        );

        Owl = (await ethers.getContractAt('ERC721Owl', address)) as ERC721Owl;
    });

    describe('Caller Approved', () => {
        //let OwlGSNContract: ERC721Owl;

        before(async () => {
            //Setup GSN-connected contract

            //mint NFT
            [testNFT] = await createERC721(1, 1);
            //await testNFT.transferFrom(signer1.address, signer2.address, 1);
            //expect(await testNFT.balanceOf(signer2.address)).to.equal(1); //make sure signer 2 owns the NFT

            //deploy paymaster
            NFTOwnershipPaymasterFactory = (await ethers.getContractFactory(
                'NFTOwnershipPaymaster',
            )) as NFTOwnershipPaymaster__factory;
            NFTPaymaster = await NFTOwnershipPaymasterFactory.deploy();
            NFTPaymaster = NFTPaymaster.connect(signer1);
            await NFTPaymaster.deployed();

            await NFTPaymaster.connect(signer1).setRelayHub(relayHubAddress);
            await web3.eth.sendTransaction({ from: signer1.address, to: NFTPaymaster.address, value: 1e18 });

            gsnConfig = {
                // loggerConfiguration: {
                //     logLevel: 'error',
                // },
                paymasterAddress: NFTPaymaster.address,
                auditorsCount: 0,
                preferredRelays: [gsn.relayUrl],
            };

            //@ts-ignore
            const gsnProvider = RelayProvider.newProvider({ provider: web3provider, gsnConfig });
            //await gsnProvider.init();

            //const account = new ethers.Wallet(Buffer.from('1'.repeat(64), 'hex'));
            //gsnProvider.addAccount(account.privateKey);

            // gsnProvider is now an rpc provider with GSN support. make it an ethers provider:
            //@ts-ignore
            etherProvider = new ethers.providers.Web3Provider(gsnProvider);
            // gsn.relayProvider.relayClient.config.paymasterAddress = NFTPaymaster.address;
            //@ts-ignore
            // etherProvider = new ethers.providers.Web3Provider(gsn.relayProvider);
            console.log('our paymaster', NFTPaymaster.address);

            //Owl = Owl.connect(etherProvider.getSigner(signer2.address));
        });

        it('gasless mint()', async () => {
            const initialBalance = await ethers.provider.getBalance(signer1.address);

            await Owl.connect(etherProvider.getSigner(signer1.address)).mint(signer1.address, '2', { gasLimit: 1e6 });

            // Ensure exists
            const exists = await Owl.exists('2');
            assert.equal(exists, true, 'Token not minted!');

            // No gas was spent by user
            const finalBalance = await ethers.provider.getBalance(signer1.address);
            expect(finalBalance).to.equal(initialBalance);
        });
    });
});

/* describe('Caller not approved', () => {
    //initialize the paymaster so that the acceptable NFT has tokenId = 1
    //do NOT give ownership of tokenId 1 to the caller
    //let OwlGSNContract: ERC721Owl;

    before(async () => {
        //Setup GSN-connected contract
        //OwlGSNContract = Owl.connect(web3provider.getSigner(signer2.address));

        //mint NFT
        [testNFT] = await createERC721(1, 1);
        expect(await testNFT.balanceOf(signer2.address)).to.equal(0); //make sure signer 2 does NOT own the NFT

        //deploy paymaster
        NFTOwnershipPaymasterFactory = (await ethers.getContractFactory(
            'NFTOwnershipPaymaster',
        )) as NFTOwnershipPaymaster__factory;
        NFTPaymaster = await NFTOwnershipPaymasterFactory.deploy(testNFT.address, 1);
        NFTPaymaster = NFTPaymaster.connect(signer2);
        await NFTPaymaster.deployed();

        await NFTPaymaster.connect(signer1).setRelayHub(relayHubAddress);
        await web3.eth.sendTransaction({ from: signer1.address, to: NFTPaymaster.address, value: 1e18 });
    });

    it('mint() with gas', async () => {
        const initialBalance = await ethers.provider.getBalance(signer2.address);

        await OwlGSNContract.mint(signer2.address, '2', { gasLimit: 1e6 });

        // Ensure exists
        const exists = await OwlGSNContract.exists('2');
        assert.equal(exists, true, 'Token not minted!');

        //Gas was spent by user
        const finalBalance = await ethers.provider.getBalance(signer2.address);
        assert.isTrue(finalBalance.lt(initialBalance), 'finalBalance !< initialBalance');
    }); */
