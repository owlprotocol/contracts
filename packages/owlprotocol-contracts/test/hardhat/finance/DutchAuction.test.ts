import { ethers, network } from 'hardhat';
import { increaseTo, increase } from '@nomicfoundation/hardhat-network-helpers/dist/src/helpers/time';
const { utils } = ethers;
const { parseUnits } = utils;
import { expect, assert } from 'chai';
// import { SignerWithAddress } from '@nomiclabs/hardhat-ethers/signers';
import {
    DutchAuction,
    DutchAuction__factory,
    ERC20,
    ERC721,
    ERC1155,
    ERC1167Factory,
    ERC1167Factory__factory,
} from '../../../typechain';

import { createERC20, createERC721, createERC1155, deployCloneWrap, predictDeployClone } from '../utils';
import { BigNumber } from 'ethers';
import {
    loadSignersSmart,
    loadEnvironment,
    TestingSigner,
    describeNoGSN,
} from '@owlprotocol/contract-helpers-opengsn/src';

enum TokenType {
    erc721,
    erc1155,
}

describe('DutchAuction.sol No Fees', function () {
    //Extra time
    this.timeout(100000);
    let seller: TestingSigner;
    let bidder1: TestingSigner;
    let owner: TestingSigner;

    let ERC1167FactoryFactory: ERC1167Factory__factory;
    let ERC1167Factory: ERC1167Factory;

    let DutchAuctionFactory: DutchAuction__factory;
    let DutchAuctionImplementation: DutchAuction;

    let gsnForwarderAddress = '0x0000000000000000000000000000000000000001';

    before(async () => {
        //Setup Test Environment
        ({ gsnForwarderAddress } = await loadEnvironment(ethers, network));
        [seller, bidder1, owner] = await loadSignersSmart(ethers, network);

        //launch Auction + implementation
        DutchAuctionFactory = (await ethers.getContractFactory('DutchAuction')) as DutchAuction__factory;
        DutchAuctionImplementation = await DutchAuctionFactory.deploy();

        // Launch ERC1167 Factory
        ERC1167FactoryFactory = (await ethers.getContractFactory('ERC1167Factory')) as ERC1167Factory__factory;
        ERC1167Factory = await ERC1167FactoryFactory.deploy();

        await Promise.all([DutchAuctionImplementation.deployed()]);
    });

    describeNoGSN('Linear Auction Tests - No GSN', () => {
        //define setup
        let testNFT: ERC721;
        const tokenId = 0;
        let acceptableERC20Token: ERC20;
        let DutchAuctionAddress: string;

        let originalERC20Balance: BigNumber;

        let auction: DutchAuction;

        beforeEach(async () => {
            //Deploy ERC20 and ERC721
            [acceptableERC20Token] = await createERC20(); //mints 1e9 tokens
            [testNFT] = await createERC721(1, 1); //minting one token

            //predict deployment address
            DutchAuctionAddress = await predictDeployClone(
                DutchAuctionImplementation,
                [
                    //seller address
                    //Asset
                    //ERC20 Contract address (acceptable token)
                    //start price
                    //end price
                    //auction duration
                    //isNonLinear
                    //saleFee
                    //saleFeeAddress
                    seller.address,
                    {
                        token: TokenType.erc721,
                        contractAddr: testNFT.address,
                        tokenId,
                    },
                    acceptableERC20Token.address,
                    100, //in "eth"
                    10,
                    300,
                    false,
                    0,
                    owner.address,
                    gsnForwarderAddress,
                ],
                ERC1167Factory,
            );

            //Set Approval ERC721 for sale
            await testNFT.connect(seller).approve(DutchAuctionAddress, tokenId);

            await acceptableERC20Token.connect(bidder1).approve(DutchAuctionAddress, parseUnits('100.0', 18));
            await acceptableERC20Token.connect(bidder1).approve(seller.address, parseUnits('100.0', 18));
            await acceptableERC20Token.connect(bidder1).approve(owner.address, parseUnits('100.0', 18));
            // Transfer ERC20s to bidders
            await acceptableERC20Token.connect(seller).transfer(bidder1.address, parseUnits('100.0', 18));

            //deploy contract
            auction = (
                await deployCloneWrap(
                    DutchAuctionImplementation,
                    [
                        //seller address
                        //Asset
                        //ERC20 Contract address (acceptable token)
                        //start price
                        //end price
                        //auction duration
                        //isNonLinear
                        //saleFee
                        //saleFeeAddress
                        seller.address,
                        {
                            token: TokenType.erc721,
                            contractAddr: testNFT.address,
                            tokenId,
                        },
                        acceptableERC20Token.address,
                        100, //in "eth"
                        10,
                        300,
                        false,
                        0,
                        owner.address,
                        gsnForwarderAddress,
                    ],
                    ERC1167Factory,
                    undefined,
                    undefined,
                    seller,
                )
            ).contract as DutchAuction;

            //assert initial token amounts
            const totalERC20Minted: BigNumber = parseUnits('1.0', 27);
            expect(await acceptableERC20Token.balanceOf(seller.address)).to.equal(
                totalERC20Minted.sub(parseUnits('100.0', 18)),
            );

            originalERC20Balance = parseUnits('100.0', 18);
            expect(await testNFT.balanceOf(seller.address)).to.equal(0);
            expect(await testNFT.balanceOf(DutchAuctionAddress)).to.equal(1);
            expect(await acceptableERC20Token.balanceOf(bidder1.address)).to.equal(originalERC20Balance);
        });

        it('simple auction - 1 bidder - Regular', async () => {
            const initialBalance = await ethers.provider.getBalance(bidder1.address);
            expect(await testNFT.balanceOf(auction.address)).to.equal(1);
            expect(await testNFT.balanceOf(seller.address)).to.equal(0);

            expect(await auction.getCurrentPrice()).to.equal(parseUnits('100.0', 18));
            await increase(23);
            expect(await auction.getCurrentPrice()).to.equal(parseUnits('93.100000000000000060', 18)); // known to fail/deviate occassionally
            await increase(25);

            const sellerBalance = await acceptableERC20Token.balanceOf(seller.address);
            const tx1 = await auction.connect(bidder1).bid();
            await tx1.wait();

            expect(await auction.getCurrentPrice()).to.equal(parseUnits('85.300000000000000030', 18));

            const balance: BigNumber = parseUnits('100.0', 18);
            expect(await acceptableERC20Token.balanceOf(bidder1.address)).to.equal(
                balance.sub(parseUnits('85.300000000000000030', 18)),
            );
            expect(await acceptableERC20Token.balanceOf(seller.address)).to.equal(
                sellerBalance.add(parseUnits('85.300000000000000030', 18)),
            );
            expect(await testNFT.balanceOf(bidder1.address)).to.equal(1);
            expect(await testNFT.balanceOf(auction.address)).to.equal(0);

            const finalBalance = await ethers.provider.getBalance(bidder1.address);
            assert.isTrue(finalBalance.lt(initialBalance), 'finalBalance !< initialBalance');
        });

        it('simple auction - 1 bidder - GSN', async () => {
            const initialBalance = await ethers.provider.getBalance(bidder1.address);
            expect(await testNFT.balanceOf(auction.address)).to.equal(1);
            expect(await testNFT.balanceOf(seller.address)).to.equal(0);

            expect(await auction.getCurrentPrice()).to.equal(parseUnits('100.0', 18));
            await increase(23);
            expect(await auction.getCurrentPrice()).to.equal(parseUnits('93.100000000000000060', 18)); // known to fail/deviate occassionally
            await increase(25);

            const sellerBalance = await acceptableERC20Token.balanceOf(seller.address);
            const tx1 = await auction.connect(bidder1).bid();
            await tx1.wait();

            expect(await auction.getCurrentPrice()).to.equal(parseUnits('85.300000000000000030', 18));

            const balance: BigNumber = parseUnits('100.0', 18);
            expect(await acceptableERC20Token.balanceOf(bidder1.address)).to.equal(
                balance.sub(parseUnits('85.300000000000000030', 18)),
            );
            expect(await acceptableERC20Token.balanceOf(seller.address)).to.equal(
                sellerBalance.add(parseUnits('85.300000000000000030', 18)),
            );
            expect(await testNFT.balanceOf(bidder1.address)).to.equal(1);
            expect(await testNFT.balanceOf(auction.address)).to.equal(0);

            const finalBalance = await ethers.provider.getBalance(bidder1.address);
            assert.isTrue(finalBalance.lt(initialBalance), 'finalBalance !< initialBalance');
        });

        it('simple auction - no bidder, auction ends', async () => {
            //await auction.withdraw();

            expect(await testNFT.balanceOf(auction.address)).to.equal(1);
            expect(await testNFT.balanceOf(seller.address)).to.equal(0);

            await increase(300);
            expect(await auction.getCurrentPrice()).to.equal(parseUnits('10.0', 18));
            await auction.claim();

            expect(await testNFT.balanceOf(seller.address)).to.equal(1);
            expect(await testNFT.balanceOf(auction.address)).to.equal(0);
        });

        it('error: bid after auction ends', async () => {
            await increase(300);
            expect(await auction.getCurrentPrice()).to.equal(parseUnits('10.0', 18));
            await expect(auction.connect(bidder1).bid()).to.be.revertedWith('DutchAuction: ended');
        });
    });

    describe('Nonlinear Auction Tests', () => {
        //define setup
        let testNFT: ERC721;
        const tokenId = 0;
        let acceptableERC20Token: ERC20;
        let DutchAuctionAddress: string;
        let auction: DutchAuction;

        let originalERC20Balance: BigNumber;

        beforeEach(async () => {
            //Deploy ERC20 and ERC721
            [acceptableERC20Token] = await createERC20(); //mints 1e9 tokens
            [testNFT] = await createERC721(1, 1); //minting one token

            //deploy contract
            DutchAuctionAddress = await predictDeployClone(
                DutchAuctionImplementation,
                [
                    //seller address
                    //Asset
                    //ERC20 Contract address (acceptable token)
                    //start price
                    //end price
                    //auction duration
                    //isNonLinear
                    //saleFee
                    //saleFeeAddress
                    seller.address,
                    {
                        token: TokenType.erc721,
                        contractAddr: testNFT.address,
                        tokenId,
                    },
                    acceptableERC20Token.address,
                    100, //in "eth"
                    10,
                    300,
                    true,
                    0,
                    owner.address,
                    gsnForwarderAddress,
                ],
                ERC1167Factory,
            );

            //Set Approval ERC721 for sale
            await testNFT.connect(seller).approve(DutchAuctionAddress, tokenId);
            await acceptableERC20Token.connect(bidder1).approve(DutchAuctionAddress, parseUnits('100.0', 18));
            await acceptableERC20Token.connect(bidder1).approve(seller.address, parseUnits('100.0', 18));
            await acceptableERC20Token.connect(bidder1).approve(owner.address, parseUnits('100.0', 18));

            // Transfer ERC20s to bidders
            await acceptableERC20Token.connect(seller).transfer(bidder1.address, parseUnits('100.0', 18));

            await deployCloneWrap(
                DutchAuctionImplementation,
                [
                    //seller address
                    //Asset
                    //ERC20 Contract address (acceptable token)
                    //start price
                    //end price
                    //auction duration
                    //isNonLinear
                    //saleFee
                    //saleFeeAddress
                    seller.address,
                    {
                        token: TokenType.erc721,
                        contractAddr: testNFT.address,
                        tokenId,
                    },
                    acceptableERC20Token.address,
                    100, //in "eth"
                    10,
                    300,
                    true,
                    0,
                    owner.address,
                    gsnForwarderAddress,
                ],
                ERC1167Factory,
            );

            auction = (await ethers.getContractAt('DutchAuction', DutchAuctionAddress)) as DutchAuction;

            //assert initial token amounts
            const totalERC20Minted: BigNumber = parseUnits('1.0', 27);
            expect(await acceptableERC20Token.balanceOf(seller.address)).to.equal(
                totalERC20Minted.sub(parseUnits('100.0', 18)),
            );

            originalERC20Balance = parseUnits('100.0', 18);
            expect(await testNFT.balanceOf(seller.address)).to.equal(0);
            expect(await testNFT.balanceOf(DutchAuctionAddress)).to.equal(1);
            expect(await acceptableERC20Token.balanceOf(bidder1.address)).to.equal(originalERC20Balance);
        });

        it('simple auction - 1 bidder', async () => {
            expect(await testNFT.balanceOf(auction.address)).to.equal(1);
            expect(await testNFT.balanceOf(seller.address)).to.equal(0);

            expect(await auction.getCurrentPrice()).to.equal(parseUnits('100.0', 18));

            await increase(23);
            expect(await auction.getCurrentPrice()).to.equal(parseUnits('99.583401815135389380', 18)); // known to fail/deviate occassionally
            await increase(25);

            const sellerBalance = await acceptableERC20Token.balanceOf(seller.address);
            const tx2 = await auction.connect(bidder1).bid();
            await tx2.wait();
            expect(await auction.getCurrentPrice()).to.equal(parseUnits('98.902387139793339487', 18));

            const balance: BigNumber = parseUnits('100.0', 18);

            expect(await acceptableERC20Token.balanceOf(bidder1.address)).to.equal(
                balance.sub(parseUnits('98.902387139793339487', 18)),
            );
            expect(await acceptableERC20Token.balanceOf(seller.address)).to.equal(
                sellerBalance.add(parseUnits('98.902387139793339487', 18)),
            );
            expect(await testNFT.balanceOf(bidder1.address)).to.equal(1);
            expect(await testNFT.balanceOf(auction.address)).to.equal(0);
        });

        it('simple auction - no bidder, auction ends', async () => {
            //await auction.withdraw();
            expect(await testNFT.balanceOf(auction.address)).to.equal(1);
            expect(await testNFT.balanceOf(seller.address)).to.equal(0);

            await increase(300);
            expect(await auction.getCurrentPrice()).to.equal(parseUnits('10.0', 18));
            await increase(1);
            expect(await auction.getCurrentPrice()).to.equal(parseUnits('10.0', 18));
            await auction.claim();

            expect(await testNFT.balanceOf(seller.address)).to.equal(1);
            expect(await testNFT.balanceOf(auction.address)).to.equal(0);
        });

        it('error: bid after auction ends', async () => {
            await increase(300);
            expect(await auction.getCurrentPrice()).to.equal(parseUnits('10.0', 18));
            await expect(auction.connect(bidder1).bid()).to.be.revertedWith('DutchAuction: ended');
        });
    });

    describe('DutchAuction.sol ERC 1155', function () {
        //Extra time
        this.timeout(100000);
        let seller: TestingSigner;
        let bidder1: TestingSigner;

        let DutchAuctionFactory: DutchAuction__factory;
        let DutchAuctionImplementation: DutchAuction;

        let ERC1167FactoryFactory: ERC1167Factory__factory;
        let ERC1167Factory: ERC1167Factory;

        before(async () => {
            //launch Auction + implementation
            DutchAuctionFactory = (await ethers.getContractFactory('DutchAuction')) as DutchAuction__factory;
            DutchAuctionImplementation = await DutchAuctionFactory.deploy();

            // Launch ERC1167 Factory
            ERC1167FactoryFactory = (await ethers.getContractFactory('ERC1167Factory')) as ERC1167Factory__factory;
            ERC1167Factory = await ERC1167FactoryFactory.deploy();

            await Promise.all([ERC1167Factory.deployed(), DutchAuctionImplementation.deployed()]);

            //get users (seller + bidder?)
            [seller, bidder1] = await loadSignersSmart(ethers, network);
        });

        describe('Linear Auction Tests', () => {
            //define setup
            let test1155: ERC1155;
            let acceptableERC20Token: ERC20;
            let DutchAuctionAddress: string;
            let auction: DutchAuction;

            let originalERC20Balance: BigNumber;

            beforeEach(async () => {
                //Deploy ERC20 and ERC721
                [acceptableERC20Token] = await createERC20(); //mints 1e9 tokens
                [test1155] = await createERC1155(); //minting one token

                //deploy contract
                DutchAuctionAddress = await predictDeployClone(
                    DutchAuctionImplementation,
                    [
                        //seller address
                        //Asset
                        //ERC20 Contract address (acceptable token)
                        //start price
                        //end price
                        //auction duration
                        //isNonLinear
                        //saleFee
                        //saleFeeAddress
                        seller.address,
                        {
                            token: TokenType.erc1155,
                            contractAddr: test1155.address,
                            tokenId: 1,
                        },
                        acceptableERC20Token.address,
                        100, //in "eth"
                        10,
                        300,
                        false,
                        0,
                        owner.address,
                        gsnForwarderAddress,
                    ],
                    ERC1167Factory,
                );

                //Set Approval ERC115 for sale
                await test1155.connect(seller).setApprovalForAll(DutchAuctionAddress, true);
                await acceptableERC20Token.connect(bidder1).approve(DutchAuctionAddress, parseUnits('100.0', 18));
                await acceptableERC20Token.connect(bidder1).approve(seller.address, parseUnits('100.0', 18));
                await acceptableERC20Token.connect(bidder1).approve(owner.address, parseUnits('100.0', 18));

                // Transfer ERC20s to bidders
                await acceptableERC20Token.connect(seller).transfer(bidder1.address, parseUnits('100.0', 18));

                await deployCloneWrap(
                    DutchAuctionImplementation,
                    [
                        //seller address
                        //Asset
                        //ERC20 Contract address (acceptable token)
                        //start price
                        //end price
                        //auction duration
                        //isNonLinear
                        //saleFee
                        //saleFeeAddress
                        seller.address,
                        {
                            token: TokenType.erc1155,
                            contractAddr: test1155.address,
                            tokenId: 1,
                        },
                        acceptableERC20Token.address,
                        100, //in "eth"
                        10,
                        300,
                        false,
                        0,
                        owner.address,
                        gsnForwarderAddress,
                    ],
                    ERC1167Factory,
                );

                auction = (await ethers.getContractAt('DutchAuction', DutchAuctionAddress)) as DutchAuction;

                //assert initial token amounts
                const totalERC20Minted: BigNumber = parseUnits('1.0', 27);
                expect(await acceptableERC20Token.balanceOf(seller.address)).to.equal(
                    totalERC20Minted.sub(parseUnits('100.0', 18)),
                );

                originalERC20Balance = parseUnits('100.0', 18);
                expect(await test1155.balanceOf(seller.address, 1)).to.equal(99);
                expect(await test1155.balanceOf(DutchAuctionAddress, 1)).to.equal(1);
                expect(await acceptableERC20Token.balanceOf(bidder1.address)).to.equal(originalERC20Balance);
            });

            it('simple auction - 1 bidder', async () => {
                expect(await test1155.balanceOf(auction.address, 1)).to.equal(1);
                expect(await test1155.balanceOf(seller.address, 1)).to.equal(99);

                expect(await auction.getCurrentPrice()).to.equal(parseUnits('100.0', 18));
                await increase(23);
                expect(await auction.getCurrentPrice()).to.equal(parseUnits('93.100000000000000060', 18));
                await increase(25);

                const sellerBalance = await acceptableERC20Token.balanceOf(seller.address);
                const tx1 = await auction.connect(bidder1).bid();
                await tx1.wait();
                expect(await auction.getCurrentPrice()).to.equal(parseUnits('85.300000000000000030', 18));

                const balance: BigNumber = parseUnits('100.0', 18);
                expect(await acceptableERC20Token.balanceOf(bidder1.address)).to.equal(
                    balance.sub(parseUnits('85.300000000000000030', 18)),
                );
                expect(await acceptableERC20Token.balanceOf(seller.address)).to.equal(
                    sellerBalance.add(parseUnits('85.300000000000000030', 18)),
                );
                expect(await test1155.balanceOf(bidder1.address, 1)).to.equal(1);
                expect(await test1155.balanceOf(auction.address, 1)).to.equal(0);
            });

            it('simple auction - no bidder, auction ends', async () => {
                expect(await test1155.balanceOf(auction.address, 1)).to.equal(1);
                expect(await test1155.balanceOf(seller.address, 1)).to.equal(99);

                await increase(300);
                expect(await auction.getCurrentPrice()).to.equal(parseUnits('10.0', 18));
                await auction.claim();

                expect(await test1155.balanceOf(seller.address, 1)).to.equal(100);
                expect(await test1155.balanceOf(auction.address, 1)).to.equal(0);
            });

            it('error: bid after auction ends', async () => {
                await increase(300);
                expect(await auction.getCurrentPrice()).to.equal(parseUnits('10.0', 18));
                await expect(auction.connect(bidder1).bid()).to.be.revertedWith('DutchAuction: ended');
            });
        });
    });
});

describe('DutchAuction.sol 10% Fees', function () {
    //Extra time
    this.timeout(100000);
    let seller: TestingSigner;
    let bidder1: TestingSigner;
    let owner: TestingSigner;

    let DutchAuctionFactory: DutchAuction__factory;
    let DutchAuctionImplementation: DutchAuction;

    let ERC1167FactoryFactory: ERC1167Factory__factory;
    let ERC1167Factory: ERC1167Factory;

    let gsnForwarderAddress = '0x0000000000000000000000000000000000000001';

    before(async () => {
        //Setup Test Environment
        ({ gsnForwarderAddress } = await loadEnvironment(ethers, network));

        //launch Auction + implementation
        DutchAuctionFactory = (await ethers.getContractFactory('DutchAuction')) as DutchAuction__factory;
        DutchAuctionImplementation = await DutchAuctionFactory.deploy();

        // Launch ERC1167 Factory
        ERC1167FactoryFactory = (await ethers.getContractFactory('ERC1167Factory')) as ERC1167Factory__factory;
        ERC1167Factory = await ERC1167FactoryFactory.deploy();
        // await Promise.all([ERC1167Factory.deployed(), DutchAuctionImplementation.deployed()]);

        //get users
        [seller, bidder1, owner] = await loadSignersSmart(ethers, network);
    });
    describe('Linear Auction Tests', () => {
        //define setup
        let testNFT: ERC721;
        const tokenId = 0;
        let acceptableERC20Token: ERC20;
        let DutchAuctionAddress: string;
        let auction: DutchAuction;

        let originalERC20Balance: BigNumber = BigNumber.from(0);

        beforeEach(async () => {
            //Deploy ERC20 and ERC721

            await network.provider.send('evm_setAutomine', [true]);
            [acceptableERC20Token] = await createERC20(1, bidder1); //mints 1e9 tokens
            [testNFT] = await createERC721(1, 1); //minting one token

            //deploy contract
            DutchAuctionAddress = await predictDeployClone(
                DutchAuctionImplementation,
                [
                    //seller address
                    //Asset
                    //ERC20 Contract address (acceptable token)
                    //start price
                    //end price
                    //auction duration
                    //isNonLinear
                    //saleFee
                    //saleFeeAddress
                    seller.address,
                    {
                        token: TokenType.erc721,
                        contractAddr: testNFT.address,
                        tokenId,
                    },
                    acceptableERC20Token.address,
                    100, //in "eth"
                    10,
                    300,
                    false,
                    10,
                    owner.address,
                    gsnForwarderAddress,
                ],
                ERC1167Factory,
            );

            //Set Approval ERC721 for sale
            await testNFT.connect(seller).approve(DutchAuctionAddress, tokenId);
            await acceptableERC20Token.connect(bidder1).approve(DutchAuctionAddress, parseUnits('100.0', 18));
            await acceptableERC20Token.connect(bidder1).approve(seller.address, parseUnits('100.0', 18));
            await acceptableERC20Token.connect(bidder1).approve(owner.address, parseUnits('100.0', 18));

            auction = (
                await deployCloneWrap(
                    DutchAuctionImplementation,
                    [
                        //seller address
                        //Asset
                        //ERC20 Contract address (acceptable token)
                        //start price
                        //end price
                        //auction duration
                        //isNonLinear
                        //saleFee
                        //saleFeeAddress
                        seller.address,
                        {
                            token: TokenType.erc721,
                            contractAddr: testNFT.address,
                            tokenId,
                        },
                        acceptableERC20Token.address,
                        100, //in "eth"
                        10,
                        300,
                        false,
                        10,
                        owner.address,
                        gsnForwarderAddress,
                    ],
                    ERC1167Factory,
                    undefined,
                    undefined,
                    seller,
                )
            ).contract as DutchAuction;

            // auction = (await ethers.getContractAt('DutchAuction', DutchAuctionAddress)) as DutchAuction;

            //assert initial token amounts
            originalERC20Balance = parseUnits('1000000000.0', 18);
            expect(await testNFT.balanceOf(seller.address), 'seller has NFTs').to.equal(0);
            expect(await testNFT.balanceOf(DutchAuctionAddress), 'dutch auction does NOT have NFT').to.equal(1);
            expect(await acceptableERC20Token.balanceOf(bidder1.address), 'bidder has no bal').to.equal(originalERC20Balance);
        });

        it('test', async () => {
            [acceptableERC20Token] = await createERC20(1, bidder1); //mints 1e9 tokens
            [testNFT] = await createERC721(1, 1); //minting one token

            //DutchAuction Data
            //@ts-ignore
            DutchAuctionAddress = await predictDeployClone(
                DutchAuctionImplementation,
                [
                    seller.address,
                    {
                        token: TokenType.erc721,
                        contractAddr: testNFT.address,
                        tokenId,
                    },
                    acceptableERC20Token.address,
                    90, //in "eth"
                    5,
                    300,
                    false,
                    9,
                    owner.address,
                    gsnForwarderAddress,
                ],
                ERC1167Factory,
            );

            await testNFT.connect(seller).approve(DutchAuctionAddress, tokenId);
            await acceptableERC20Token.connect(bidder1).approve(DutchAuctionAddress, parseUnits('100.0', 18));
            await acceptableERC20Token.connect(bidder1).approve(seller.address, parseUnits('100.0', 18));
            await acceptableERC20Token.connect(bidder1).approve(owner.address, parseUnits('100.0', 18));
            await network.provider.send('evm_setAutomine', [false]);

            deployCloneWrap(
                DutchAuctionImplementation,
                [
                    seller.address,
                    {
                        token: TokenType.erc721,
                        contractAddr: testNFT.address,
                        tokenId,
                    },
                    acceptableERC20Token.address,
                    90, //in "eth"
                    5,
                    300,
                    false,
                    9,
                    owner.address,
                    gsnForwarderAddress,
                ],
                ERC1167Factory,
            );
            const auction2 = (await ethers.getContractAt('DutchAuction', DutchAuctionAddress)) as DutchAuction;

            auction2.connect(bidder1).bid();

            await network.provider.send('evm_setAutomine', [true]);
            // // getting timestamp
            const blockNumBefore = await ethers.provider.getBlockNumber();
            const blockBefore = await ethers.provider.getBlock(blockNumBefore);
            const timestampBefore = blockBefore.timestamp;

            const blockNumBefore2 = await ethers.provider.getBlockNumber();
            const blockBefore2 = await ethers.provider.getBlock(blockNumBefore2);
            const timestampBefore2 = blockBefore2.timestamp;
        });

        it('simple auction - 1 bidder', async () => {
            expect(await testNFT.balanceOf(auction.address)).to.equal(1);
            expect(await testNFT.balanceOf(seller.address)).to.equal(0);

            expect(await auction.getCurrentPrice()).to.equal(parseUnits('100.0', 18));

            const sellerBalance = await acceptableERC20Token.balanceOf(seller.address);
            const tx1 = await auction.connect(bidder1).bid();
            const pricePaid = await auction.getCurrentPrice();
            const bidderBalance: BigNumber = await acceptableERC20Token.balanceOf(bidder1.address);

            expect(bidderBalance).to.equal(originalERC20Balance.sub(pricePaid));

            expect(await acceptableERC20Token.balanceOf(seller.address)).to.equal(
                sellerBalance.add(pricePaid.mul(9).div(10)),
            );

            expect(await acceptableERC20Token.balanceOf(owner.address)).to.equal(pricePaid.mul(1).div(10));

            expect(await testNFT.balanceOf(bidder1.address)).to.equal(1);
            expect(await testNFT.balanceOf(auction.address)).to.equal(0);
        });
    });
});
