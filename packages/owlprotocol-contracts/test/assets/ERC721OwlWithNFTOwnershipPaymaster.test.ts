import { assert, expect } from 'chai';
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
import {
    loadEnvironment,
    loadSignersSmart,
    TestingSigner,
    assertBalances,
} from '@owlprotocol/contract-helpers-opengsn/src';
import web3 from 'Web3';
import {
    describeGSN,
    JsonRpcSignerTesting,
    expectPaymasterThrows,
} from '@owlprotocol/contract-helpers-opengsn/src/loadSignersSmart';
import { BigNumber } from 'ethers';
import { Web3ProviderBaseInterface } from '@opengsn/common/dist/types/Aliases';

describeGSN('ERC721Owl With NFTOwnershipPaymaster', () => {
    let ERC721OwlFactory: ERC721Owl__factory;
    let ERC721OwlImplementation: ERC721Owl;

    let Owl: ERC721Owl;

    let signer1: TestingSigner;
    let signer2: TestingSigner;
    let signer3: TestingSigner;

    let testNFT: FactoryERC721;
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
        //Setup Test Environment and get addresses
        const gsn = await loadEnvironment(ethers);
        if (gsn.gsnTestEnv === undefined) throw 'Must enable gsn!';
        gsnForwarderAddress = gsn.gsnTestEnv.contractsDeployment.forwarderAddress as string;
        relayHubAddress = gsn.gsnTestEnv.contractsDeployment.relayHubAddress as string;

        [signer1, signer2, signer3] = await loadSignersSmart(ethers);

        // Deploy dummy nft
        [testNFT] = await createERC721(1, 1);
        expect(await testNFT.balanceOf(signer1.address)).to.equal(1);
        expect(await testNFT.balanceOf(signer2.address)).to.equal(0); //make sure signer 2 does NOT own the NFT

        // Deploy paymaster
        NFTOwnershipPaymasterFactory = (await ethers.getContractFactory(
            'NFTOwnershipPaymaster',
        )) as NFTOwnershipPaymaster__factory;
        NFTPaymaster = await NFTOwnershipPaymasterFactory.deploy(testNFT.address, tokenId);

        // Set relay hub and fund
        await NFTPaymaster.setRelayHub(relayHubAddress);
        await NFTPaymaster.setTrustedForwarder(gsnForwarderAddress);
        const etherSigner = await ethers.getSigner(signer1.address);
        await etherSigner.sendTransaction({ to: NFTPaymaster.address, value: BigNumber.from(10).pow(18) });

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

        const asyncApprovalData = async function (relayRequest: RelayRequest) {
            return Promise.resolve('0x0000000000000000000000000000000000000000000000000000000000000000');
        };

        // Grab local provider, then proxy through gsn and recreate ether
        const provider = new web3.providers.HttpProvider('http://localhost:8545') as Web3ProviderBaseInterface;
        const gsnProvider = (await RelayProvider.newProvider({
            provider: provider,
            config: gsnConfig,
            //@ts-ignore
            overrideDependencies: { asyncApprovalData },
        }).init()) as unknown as ExternalProvider;
        etherProvider = new ethers.providers.Web3Provider(gsnProvider);
        // TODO - create factory in loadEnvironment (will fix signers)

        // Overwrite our signer + set address field (quirk of JsonRpcSignerTesting)
        signer1 = etherProvider.getSigner(signer1.address) as JsonRpcSignerTesting;
        signer2 = etherProvider.getSigner(signer2.address) as JsonRpcSignerTesting;
        signer3 = etherProvider.getSigner(signer3.address) as JsonRpcSignerTesting;
        signer1.address = await signer1.getAddress();
        signer2.address = await signer2.getAddress();
        signer3.address = await signer3.getAddress();

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
        await Owl.connect(await ethers.getSigner(signer1.address)).grantMinter(signer2.address);

    });

    describe('Caller Approved', () => {
        it('gasless mint()', async () => {
            const initialBalance = await ethers.provider.getBalance(signer1.address);

            console.log('num times', await NFTPaymaster.getNumTransactions(tokenId));

            await Owl.connect(signer1).mint(signer1.address, '2', { gasLimit: 3e6 });
            console.log('num times', await NFTPaymaster.getNumTransactions(tokenId));

            // Ensure exists
            const exists = await Owl.exists('2');
            assert.equal(exists, true, 'Token not minted!');

            // No gas was spent by user
            const finalBalance = await ethers.provider.getBalance(signer1.address);
            expect(finalBalance).to.equal(initialBalance);
        });
    });

    describe('Caller Reached Mint Limit', () => {
        it('gasless mint()', async () => {
            const initialBalance = await ethers.provider.getBalance(signer1.address);

            //second mint is fine
            await Owl.connect(signer1).mint(signer1.address, '3', { gasLimit: 3e6 });
            console.log('num times', await NFTPaymaster.getNumTransactions(tokenId));

            // Ensure exists
            const exists = await Owl.exists('3');
            assert.equal(exists, true, 'Token not minted!');

            //third mint is fine
            await Owl.connect(signer1).mint(signer1.address, '4', { gasLimit: 3e6 });
            expect(await NFTPaymaster.getNumTransactions(tokenId)).to.equal(3);

            // Ensure exists
            const exists2 = await Owl.exists('4');
            assert.equal(exists2, true, 'Token not minted!');

            //4th mint gives errors
            await Owl.connect(signer1).mint(signer1.address, '4', { gasLimit: 3e6 });

            // No gas was spent by user
            const finalBalance = await ethers.provider.getBalance(signer1.address);
            expect(finalBalance).to.equal(initialBalance);
        });
    });

    describe('Caller Not Approved', () => {
        it('failed mint()', async () => {
            const initialBalance = await ethers.provider.getBalance(signer2.address);
            expect(await testNFT.balanceOf(signer2.address)).to.equal(0);

            expect(await Owl.connect(signer2).mint(signer2.address, '3', { gasLimit: 3e6 }));

            // Ensure exists
            const exists = await Owl.exists('3');
            assert.equal(exists, true, 'Token not minted!');

            //Gas was spent by user
            const finalBalance = await ethers.provider.getBalance(signer2.address);
            assert.isTrue(finalBalance.lt(initialBalance), 'finalBalance !< initialBalance');
        });
    });
});
