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
import { RelayProvider, GSNConfig, GSNUnresolvedConstructorInput } from '@opengsn/provider';
import { HttpProvider } from 'web3-core';

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

    let NFTPaymaster: NFTOwnershipPaymaster;
    let NFTOwnershipPaymasterFactory: NFTOwnershipPaymaster__factory;

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
        relayHubAddress = gsn.contractsDeployment.relayHubAddress as string;

        [signer1, signer2] = await ethers.getSigners();

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

    describe('Caller Approved', () => {
        //let OwlGSNContract: ERC721Owl;

        before(async () => {
            //Setup GSN-connected contract

            //mint NFT
            [testNFT] = await createERC721(1, 1);
            await testNFT.transferFrom(signer1.address, signer2.address, 1);
            expect(await testNFT.balanceOf(signer2.address)).to.equal(1); //make sure signer 2 owns the NFT

            //deploy paymaster
            NFTOwnershipPaymasterFactory = (await ethers.getContractFactory(
                'NFTOwnershipPaymaster',
            )) as NFTOwnershipPaymaster__factory;
            NFTPaymaster = await NFTOwnershipPaymasterFactory.deploy(testNFT.address, 1);
            NFTPaymaster = NFTPaymaster.connect(signer2);
            await NFTPaymaster.deployed();

            await NFTPaymaster.connect(signer1).setRelayHub(relayHubAddress);
            await web3.eth.sendTransaction({ from: signer1.address, to: NFTPaymaster.address, value: 1e18 });

            gsnConfig = {
                loggerConfiguration: {
                    logLevel: 'error',
                },
                paymasterAddress: NFTPaymaster.address,
            };

            const input: GSNUnresolvedConstructorInput = {
                //@ts-ignore
                provider: web3.currentProvider as HttpProvider,
                config: gsnConfig,
            };
            const p = RelayProvider.newProvider(input);
            await p.init();
            // @ts-ignore
            Owl.web3.setProvider(p);
        });

        it('gasless mint()', async () => {
            const initialBalance = await ethers.provider.getBalance(signer2.address);

            await Owl.connect(signer2).mint(signer2.address, '2', { gasLimit: 1e6 });

            // Ensure exists
            const exists = await Owl.exists('2');
            assert.equal(exists, true, 'Token not minted!');

            // No gas was spent by user
            const finalBalance = await ethers.provider.getBalance(signer2.address);
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
