import { assert, expect } from 'chai';
import { ethers } from 'hardhat'; //HH-connected ethers
import {
    ERC721Owl,
    ERC721Owl__factory,
    NFTOwnershipPaymaster,
    NFTOwnershipPaymaster__factory,
    FactoryERC721,
} from '../../../typechain';
import { deployClone2, createERC721 } from '../utils';
import { Web3Provider, ExternalProvider } from '@ethersproject/providers';
import { RelayProvider, GSNConfig } from '@opengsn/provider';
import { RelayRequest } from '@opengsn/common/dist/EIP712/RelayRequest';
import {
    loadEnvironment,
    loadSignersSmart,
    TestingSigner,
    assertBalances,
    expectPaymasterThrows,
    describeGSN,
    JsonRpcSignerTesting,
} from '@owlprotocol/contract-helpers-opengsn/src';
import web3 from 'web3';
import { BigNumber } from 'ethers';
import { Web3ProviderBaseInterface } from '@opengsn/common/dist/types/Aliases';

describe.skip('ERC721Owl With NFTOwnershipPaymaster', () => {
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
    let NFTPaymasterImplementation: NFTOwnershipPaymaster;

    let etherProvider: Web3Provider;
    const tokenId = 0; // this is the starting token id
    const tokenId2 = 1;
    const tokenUseLimit = 3;
    let gasPassToken = tokenId;

    /**
     * Helper functions
     */
    const getTokenIdHex = (n: number) => ethers.utils.hexZeroPad(BigNumber.from(n).toHexString(), 32);
    const asyncApprovalData = async (relayRequest: RelayRequest) => Promise.resolve(getTokenIdHex(gasPassToken));

    //Run GSN Tests here
    //Use account1 as account0 is used as relayer
    //Use Web3.js as better suited for provider
    before(async () => {
        //Setup Test Environment and get addresses
        const gsn = await loadEnvironment(ethers);
        // if (gsn.gsnTestEnv === undefined) throw 'Must enable gsn!';
        gsnForwarderAddress = gsn.gsnTestEnv.contractsDeployment.forwarderAddress as string;
        relayHubAddress = gsn.gsnTestEnv.contractsDeployment.relayHubAddress as string;

        [signer1, signer2, signer3] = await loadSignersSmart(ethers);

        // Deploy dummy nft
        [testNFT] = await createERC721(1, 3);

        // Deploy paymaster
        NFTOwnershipPaymasterFactory = (await ethers.getContractFactory(
            'NFTOwnershipPaymaster',
        )) as NFTOwnershipPaymaster__factory;
        NFTPaymasterImplementation = await NFTOwnershipPaymasterFactory.deploy();

        // Paymaster Contract
        NFTPaymaster = (
            await deployClone2({
                implementation: NFTPaymasterImplementation,
                initializerArgs: [signer1.address, testNFT.address, tokenUseLimit, gsnForwarderAddress],
                signer: signer1,
            })
        ).contract as NFTOwnershipPaymaster;

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
        await Owl.connect(await ethers.getSigner(signer1.address)).grantMinter(signer3.address);
    });

    describeGSN('Caller Approved', () => {
        it(
            'gasless mint()',
            assertBalances(ethers, async () => {
                // Use this gas pass
                gasPassToken = tokenId;

                const mintTokenId = 2;
                await Owl.connect(signer1).mint(signer1.address, mintTokenId, { gasLimit: 3e6 });

                // Ensure exists
                const exists = await Owl.exists(mintTokenId);
                assert.equal(exists, true, 'Token not minted!');
                expect(await Owl.ownerOf(mintTokenId)).to.equal(signer1.address);
            }),
        );

        it(
            'gasless mint() on transfer',
            assertBalances(ethers, async () => {
                // Use this gas pass
                gasPassToken = tokenId;
                const mintTokenId = 3;

                // Fails
                const mintCall = Owl.connect(signer3).mint(signer3.address, mintTokenId, { gasLimit: 3e6 });
                await expectPaymasterThrows(mintCall);
                // Transfer special nft
                await testNFT.connect(signer1).transferFrom(signer1.address, signer3.address, gasPassToken);
                expect(await testNFT.ownerOf(gasPassToken)).equals(signer3.address);

                // Mint passes
                await Owl.connect(signer3).mint(signer3.address, mintTokenId, { gasLimit: 3e6 });

                // Ensure exists
                const exists = await Owl.exists(mintTokenId);
                assert.equal(exists, true, 'Token not minted!');
                expect(await Owl.ownerOf(mintTokenId)).to.equal(signer3.address);
            }),
        );
    });

    describeGSN('Caller Reached Mint Limit', () => {
        it(
            'gasless mint()',
            assertBalances(ethers, async () => {
                // Use this gas pass
                gasPassToken = tokenId2;

                // first mint is fine
                await Owl.connect(signer1).mint(signer1.address, 4, { gasLimit: 3e6 });
                expect(await NFTPaymaster.getNumTransactions(gasPassToken)).to.equal(1);
                const exists = await Owl.exists(4);
                assert.equal(exists, true, 'Token not minted!');

                // second mint is fine
                await Owl.connect(signer1).mint(signer1.address, 5, { gasLimit: 3e6 });
                expect(await NFTPaymaster.getNumTransactions(gasPassToken)).to.equal(2);
                const exists2 = await Owl.exists(5);
                assert.equal(exists2, true, 'Token not minted!');

                // third mint is fine
                await Owl.connect(signer1).mint(signer1.address, 6, { gasLimit: 3e6 });
                expect(await NFTPaymaster.getNumTransactions(gasPassToken)).to.equal(3);
                const exists3 = await Owl.exists(6);
                assert.equal(exists3, true, 'Token not minted!');

                // fourth mint throws
                await expectPaymasterThrows(Owl.connect(signer1).mint(signer1.address, 7, { gasLimit: 3e6 }));
            }),
        );
    });

    describeGSN('Caller Not Approved', () => {
        it(
            'paymaster rejects',
            assertBalances(ethers, async () => {
                // Use this gas pass
                gasPassToken = 3; // user does not own token

                const mintTokenId = 8;
                const mintCall = Owl.connect(signer2).mint(signer2.address, mintTokenId, { gasLimit: 3e6 });
                await expectPaymasterThrows(mintCall);
            }),
        );
    });
});
