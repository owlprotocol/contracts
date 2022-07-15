import { assert, expect } from 'chai';
import { GsnTestEnvironment, TestEnvironment } from '@opengsn/cli/dist/GsnTestEnvironment';
import { ethers } from 'hardhat'; //HH-connected ethers
import {
    ERC721Owl,
    ERC721Owl__factory,
    NFTOwnershipPaymaster,
    NFTOwnershipPaymaster__factory,
    FactoryERC721,
} from '../../typechain';
import { deployClone2, createERC721 } from '../utils';
import { Web3Provider, ExternalProvider } from '@ethersproject/providers';
import { RelayProvider, GSNConfig } from '@opengsn/provider';
import { Web3ProviderBaseInterface } from '@opengsn/common/dist/types/Aliases';
import { TestingSigner } from '@owlprotocol/contract-helpers-opengsn/src';
import web3 from 'Web3';
import { JsonRpcSignerTesting } from '@owlprotocol/contract-helpers-opengsn/src/loadSignersSmart';
import { BigNumber } from 'ethers';
import { GSNContractsDeployment } from '@opengsn/common/dist/GSNContractsDeployment';

describe.only('ERC721Owl With NFTOwnershipPaymaster', () => {
    let ERC721OwlFactory: ERC721Owl__factory;
    let ERC721OwlImplementation: ERC721Owl;

    let Owl: ERC721Owl;

    let signer1: TestingSigner;
    let signer2: TestingSigner;

    let testNFT: FactoryERC721;
    let gsn: TestEnvironment | GSNContractsDeployment;
    let gsnConfig: Partial<GSNConfig>;

    let gsnForwarderAddress = '0x0000000000000000000000000000000000000001';
    let relayHubAddress: string;

    let NFTPaymaster: NFTOwnershipPaymaster;
    let NFTOwnershipPaymasterFactory: NFTOwnershipPaymaster__factory;

    let etherProvider: Web3Provider;
    const tokenId = 0; // this is the starting token id

    //Run GSN Tests here
    //Use account1 as account0 is used as relayer
    //Use Web3.js as better suited for provider
    before(async () => {
        [signer1, signer2] = await ethers.getSigners();

        // Deploy dummy nft
        [testNFT] = await createERC721(1, 1);
        expect(await testNFT.balanceOf(signer1.address)).to.equal(1);
        expect(await testNFT.balanceOf(signer2.address)).to.equal(0); //make sure signer 2 does NOT own the NFT

        // Deploy paymaster
        NFTOwnershipPaymasterFactory = (await ethers.getContractFactory(
            'NFTOwnershipPaymaster',
        )) as NFTOwnershipPaymaster__factory;
        NFTPaymaster = await NFTOwnershipPaymasterFactory.deploy(testNFT.address, tokenId);

        //Setup Test Environment and get addresses
        gsn = (await GsnTestEnvironment.startGsn('http://localhost:8545')).contractsDeployment;
        // gsn = GsnTestEnvironment.loadDeployment();
        gsnForwarderAddress = gsn.forwarderAddress as string;
        relayHubAddress = gsn.relayHubAddress as string;

        // Set relay hub and fund
        await NFTPaymaster.setRelayHub(relayHubAddress);
        await signer1.sendTransaction({ to: NFTPaymaster.address, value: BigNumber.from(10).pow(18) });

        // Setup config
        gsnConfig = {
            // Address configs
            paymasterAddress: NFTPaymaster.address,
            // preferredRelays: [gsn.relayUrl],
            // GSN configs
            loggerConfiguration: {
                logLevel: 'error',
            },
            auditorsCount: 0,
        };

        // Grab local provider, then proxy through gsn and recreate ether
        const provider = new web3.providers.HttpProvider('http://localhost:8545') as Web3ProviderBaseInterface;
        const gsnProvider = (await RelayProvider.newProvider({
            provider: provider,
            config: gsnConfig,
        }).init()) as unknown as ExternalProvider;
        etherProvider = new ethers.providers.Web3Provider(gsnProvider);

        // Overwrite our signer + set address field (quirk of JsonRpcSignerTesting)
        signer1 = etherProvider.getSigner(signer1.address) as JsonRpcSignerTesting;
        signer2 = etherProvider.getSigner(signer2.address) as JsonRpcSignerTesting;
        signer1.address = await signer1.getAddress();
        signer2.address = await signer2.getAddress();

        // Contract deployment
        ERC721OwlFactory = (await ethers.getContractFactory('ERC721Owl')) as ERC721Owl__factory;
        ERC721OwlImplementation = await ERC721OwlFactory.deploy();

        // Owl Contract
        Owl = (
            await deployClone2({
                implementation: ERC721OwlImplementation,
                initializerArgs: [signer1.address, 'n', 's', 'u', gsnForwarderAddress],
                signer: signer1,
            })
        ).contract as ERC721Owl;
    });

    describe('Caller Approved', () => {
        it('gasless mint()', async () => {
            const initialBalance = await ethers.provider.getBalance(signer1.address);

            await Owl.connect(signer1).mint(signer1.address, '2', { gasLimit: 3e6 });

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
