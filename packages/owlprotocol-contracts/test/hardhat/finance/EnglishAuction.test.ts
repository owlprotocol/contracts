import { ethers, network } from 'hardhat';
const { utils } = ethers;
const { parseUnits } = utils;
import { expect, assert } from 'chai';
//import _, { pick } from 'lodash';
import {
    EnglishAuction,
    EnglishAuction__factory,
    ERC1167Factory,
    ERC1167Factory__factory,
    ERC721Owl__factory,
    ERC721Owl,
    ERC1155Owl__factory,
    ERC1155Owl,
    FactoryERC20,
    FactoryERC721,
    FactoryERC1155,
    UpgradeableBeaconInitializable__factory,
    UpgradeableBeaconInitializable,
    BeaconProxyInitializable__factory,
    BeaconProxyInitializable,
} from '../../../typechain';

import { createERC20, createERC721, createERC1155, deployClone, predictDeployClone, deployCloneWrap } from '../utils';
import { BigNumber } from 'ethers';
import {
    itGSN,
    itNoGSN,
    loadForwarder,
    loadSignersSmart,
    TestingSigner,
} from '@owlprotocol/contract-helpers-opengsn/src';

enum TokenType {
    erc721,
    erc1155,
}

describe('EnglishAuction.sol No Fee', function () {
    //Extra time
    this.timeout(20000);
    let seller: TestingSigner;
    let bidder1: TestingSigner;
    let bidder2: TestingSigner;
    let bidder3: TestingSigner;
    let owner: TestingSigner;
    let EnglishAuctionFactory: EnglishAuction__factory;
    let EnglishAuctionImplementation: EnglishAuction;

    let ERC1167FactoryFactory: ERC1167Factory__factory;
    let ERC1167Factory: ERC1167Factory;

    let gsnForwarderAddress = '0x0000000000000000000000000000000000000001';
    const tokenId = 0;

    before(async () => {
        //Setup Test Environment
        gsnForwarderAddress = await loadForwarder(ethers);

        //launch Auction + implementation
        EnglishAuctionFactory = (await ethers.getContractFactory('EnglishAuction')) as EnglishAuction__factory;
        EnglishAuctionImplementation = await EnglishAuctionFactory.deploy();

        // Launch ERC1167 Factory
        ERC1167FactoryFactory = (await ethers.getContractFactory('ERC1167Factory')) as ERC1167Factory__factory;
        ERC1167Factory = await ERC1167FactoryFactory.deploy();

        await Promise.all([ERC1167Factory.deployed(), EnglishAuctionImplementation.deployed()]);

        //get users (seller + bidder?)
        [seller, bidder1, bidder2, bidder3, owner] = await loadSignersSmart(ethers);
    });

    describe('Auction Tests with ERC721', () => {
        //define setup
        let testNFT: FactoryERC721;
        let acceptableERC20Token: FactoryERC20;
        let EnglishAuctionAddress: string;
        let auction: EnglishAuction;

        let originalERC20Balance: number;

        let auctionGSN: EnglishAuction;

        beforeEach(async () => {
            //Deploy ERC20 and ERC721
            [acceptableERC20Token] = await createERC20(1); //mints 1,000,000,000 by default
            [testNFT] = await createERC721(1, 1); //minting one token

            //predict deployment address
            EnglishAuctionAddress = await predictDeployClone(
                EnglishAuctionImplementation,
                [
                    //seller address
                    //NFT
                    //ERC20 Contract address (acceptable token)
                    //starting bid
                    //auction duration
                    //reset time
                    //sale fee
                    //sale fee address
                    seller.address,
                    {
                        token: TokenType.erc721,
                        contractAddr: testNFT.address,
                        tokenId,
                    },
                    acceptableERC20Token.address,
                    2,
                    86400,
                    3600,
                    0,
                    owner.address,
                    gsnForwarderAddress,
                ],
                ERC1167Factory,
            );

            //Set Approval ERC721 for sale
            await testNFT.connect(seller).approve(EnglishAuctionAddress, tokenId);
            await acceptableERC20Token.connect(bidder1).approve(EnglishAuctionAddress, 100);
            await acceptableERC20Token.connect(bidder2).approve(EnglishAuctionAddress, 100);
            await acceptableERC20Token.connect(bidder3).approve(EnglishAuctionAddress, 100);
            // Transfer ERC20s to bidders
            await acceptableERC20Token.connect(seller).transfer(bidder1.address, 100);
            await acceptableERC20Token.connect(seller).transfer(bidder2.address, 100);
            await acceptableERC20Token.connect(seller).transfer(bidder3.address, 100);
            const totalERC20Minted: BigNumber = parseUnits('1000000000.0');
            expect(await acceptableERC20Token.balanceOf(seller.address)).to.equal(totalERC20Minted.sub(300));

            //deploy auction

            auction = (
                await deployCloneWrap(
                    EnglishAuctionImplementation,
                    [
                        //seller address
                        //NFT
                        //ERC20 Contract address (acceptable token)
                        //starting bid
                        //auction duration
                        //reset time
                        //sale fee
                        //sale fee address
                        seller.address,
                        {
                            token: TokenType.erc721,
                            contractAddr: testNFT.address,
                            tokenId,
                        },
                        acceptableERC20Token.address,
                        2,
                        86400,
                        3600,
                        0,
                        owner.address,
                        gsnForwarderAddress,
                    ],
                    ERC1167Factory,
                )
            ).contract as EnglishAuction;

            //setup GSN-connected contract
            auctionGSN = auction;

            //assert initial token amounts

            originalERC20Balance = 100;

            expect(await testNFT.balanceOf(seller.address)).to.equal(0);
            expect(await testNFT.balanceOf(EnglishAuctionAddress)).to.equal(1);
            expect(await acceptableERC20Token.balanceOf(bidder1.address)).to.equal(originalERC20Balance);
            expect(await acceptableERC20Token.balanceOf(bidder2.address)).to.equal(originalERC20Balance);
            expect(await acceptableERC20Token.balanceOf(bidder3.address)).to.equal(originalERC20Balance);
        });

        itNoGSN('simple auction - 1 bidder - Regular', async () => {
            const initialBalance = await ethers.provider.getBalance(bidder1.address);
            expect(await testNFT.balanceOf(auction.address)).to.equal(1);
            expect(await testNFT.balanceOf(seller.address)).to.equal(0);

            await auction.connect(bidder1).bid(5);
            expect(await acceptableERC20Token.balanceOf(bidder1.address)).to.equal(95);

            expect(await acceptableERC20Token.balanceOf(auction.address)).to.equal(5);

            await network.provider.send('evm_increaseTime', [86401]); //advance timestamp in seconds
            await auction.connect(seller).ownerClaim();
            await auction.connect(bidder1).winnerClaim();

            const totalERC20Minted: BigNumber = parseUnits('1000000000.0');
            expect(await acceptableERC20Token.balanceOf(seller.address)).to.equal(totalERC20Minted.sub(295));
            expect(await testNFT.balanceOf(bidder1.address)).to.equal(1);

            const finalBalance = await ethers.provider.getBalance(bidder1.address);
            assert.isTrue(finalBalance.lt(initialBalance), 'finalBalance !< initialBalance');
        });

        itGSN('simple auction - 1 bidder - GSN', async () => {
            const initialBalance = await ethers.provider.getBalance(bidder1.address);
            expect(await testNFT.balanceOf(auctionGSN.address)).to.equal(1);
            expect(await testNFT.balanceOf(seller.address)).to.equal(0);

            await auctionGSN.connect(bidder1).bid(5);
            expect(await acceptableERC20Token.balanceOf(bidder1.address)).to.equal(95);

            expect(await acceptableERC20Token.balanceOf(auctionGSN.address)).to.equal(5);

            await network.provider.send('evm_increaseTime', [86401]); //advance timestamp in seconds
            await auctionGSN.connect(seller).ownerClaim();
            await auctionGSN.connect(bidder1).winnerClaim();

            const totalERC20Minted: BigNumber = parseUnits('1000000000.0');
            expect(await acceptableERC20Token.balanceOf(seller.address)).to.equal(totalERC20Minted.sub(295));
            expect(await testNFT.balanceOf(bidder1.address)).to.equal(1);

            const finalBalance = await ethers.provider.getBalance(bidder1.address);
            assert.isTrue(finalBalance.eq(initialBalance), 'finalBalance != initialBalance');
        });

        it('complex auction - two bidders', async () => {
            expect(await testNFT.balanceOf(auction.address)).to.equal(1);
            expect(await testNFT.balanceOf(seller.address)).to.equal(0);

            await auction.connect(bidder1).bid(5);

            expect(await acceptableERC20Token.balanceOf(bidder1.address)).to.equal(95);
            expect(await acceptableERC20Token.balanceOf(auction.address)).to.equal(5);

            await auction.connect(bidder2).bid(7);
            expect(await acceptableERC20Token.balanceOf(bidder2.address)).to.equal(93);
            expect(await acceptableERC20Token.balanceOf(auction.address)).to.equal(12);

            await auction.connect(bidder3).bid(10);
            expect(await acceptableERC20Token.balanceOf(bidder3.address)).to.equal(90);
            expect(await acceptableERC20Token.balanceOf(auction.address)).to.equal(22);

            await auction.connect(bidder1).bid(20);

            expect(await acceptableERC20Token.balanceOf(bidder1.address)).to.equal(80);
            expect(await acceptableERC20Token.balanceOf(auction.address)).to.equal(37);

            await network.provider.send('evm_increaseTime', [86401]); //advance timestamp in seconds
            await auction.connect(seller).ownerClaim();
            await auction.connect(bidder1).winnerClaim();

            const totalERC20Minted: BigNumber = parseUnits('1000000000.0');
            expect(await acceptableERC20Token.balanceOf(seller.address)).to.equal(totalERC20Minted.sub(280));
            expect(await testNFT.balanceOf(bidder1.address)).to.equal(1);
            await expect(auction.connect(bidder1).withdraw()).to.be.revertedWith(
                'EnglishAuction: the highest bidder cannot withdraw!',
            );
            await auction.connect(bidder2).withdraw();
            await auction.connect(bidder3).withdraw();
            expect(await acceptableERC20Token.balanceOf(bidder1.address)).to.equal(80);
            expect(await acceptableERC20Token.balanceOf(bidder2.address)).to.equal(100);
            expect(await acceptableERC20Token.balanceOf(bidder3.address)).to.equal(100);
        });

        it('error: bid too low', async () => {
            expect(await testNFT.balanceOf(auction.address)).to.equal(1);
            expect(await testNFT.balanceOf(seller.address)).to.equal(0);

            await auction.connect(bidder1).bid(5);
            expect(await acceptableERC20Token.balanceOf(bidder1.address)).to.equal(95);
            expect(await acceptableERC20Token.balanceOf(auction.address)).to.equal(5);

            await expect(auction.connect(bidder2).bid(3)).to.be.revertedWith('value <= highest');
        });

        it('error: bid after auction ends', async () => {
            expect(await testNFT.balanceOf(auction.address)).to.equal(1);
            expect(await testNFT.balanceOf(seller.address)).to.equal(0);

            await auction.connect(bidder1).bid(5);
            expect(await acceptableERC20Token.balanceOf(bidder1.address)).to.equal(95);
            expect(await acceptableERC20Token.balanceOf(auction.address)).to.equal(5);

            await network.provider.send('evm_increaseTime', [86401]); //advance timestamp in seconds

            await auction.connect(seller).ownerClaim();
            await auction.connect(bidder1).winnerClaim();
            await expect(auction.connect(bidder2).bid(7)).to.be.revertedWith('ended');
        });

        it('error: withdraw as highest bidder before ended', async () => {
            expect(await testNFT.balanceOf(auction.address)).to.equal(1);
            expect(await testNFT.balanceOf(seller.address)).to.equal(0);

            await auction.connect(bidder1).bid(5);
            expect(await acceptableERC20Token.balanceOf(bidder1.address)).to.equal(95);
            expect(await acceptableERC20Token.balanceOf(auction.address)).to.equal(5);

            await auction.connect(bidder2).bid(10);
            expect(await acceptableERC20Token.balanceOf(bidder2.address)).to.equal(90);
            expect(await acceptableERC20Token.balanceOf(auction.address)).to.equal(15);

            await expect(auction.connect(bidder2).withdraw()).to.be.revertedWith('the highest bidder cannot withdraw!');

            await network.provider.send('evm_increaseTime', [86401]); //advance timestamp in seconds

            await auction.connect(seller).ownerClaim();
            await auction.connect(bidder2).winnerClaim();

            const totalERC20Minted: BigNumber = parseUnits('1000000000.0');
            expect(await acceptableERC20Token.balanceOf(seller.address)).to.equal(totalERC20Minted.sub(290));
            await auction.connect(bidder1).withdraw();
            expect(await testNFT.balanceOf(bidder2.address)).to.equal(1);
            expect(await acceptableERC20Token.balanceOf(bidder1.address)).to.equal(100);
            expect(await acceptableERC20Token.balanceOf(bidder2.address)).to.equal(90);
        });

        it('test reset time', async () => {
            expect(await testNFT.balanceOf(auction.address)).to.equal(1);
            expect(await testNFT.balanceOf(seller.address)).to.equal(0);

            await auction.connect(bidder1).bid(5);
            expect(await acceptableERC20Token.balanceOf(bidder1.address)).to.equal(95);
            expect(await acceptableERC20Token.balanceOf(auction.address)).to.equal(5);

            await auction.connect(bidder2).bid(10);
            expect(await acceptableERC20Token.balanceOf(bidder2.address)).to.equal(90);
            expect(await acceptableERC20Token.balanceOf(auction.address)).to.equal(15);

            await expect(auction.connect(bidder2).withdraw()).to.be.revertedWith('the highest bidder cannot withdraw!');

            await network.provider.send('evm_increaseTime', [82800]); //advance timestamp in seconds
            await expect(auction.connect(seller).ownerClaim()).to.be.revertedWith('not ended');
            await network.provider.send('evm_increaseTime', [60]);
            await auction.connect(bidder1).bid(15);
            await network.provider.send('evm_increaseTime', [3540]);
            await expect(auction.connect(seller).ownerClaim()).to.be.revertedWith('not ended');
            await network.provider.send('evm_increaseTime', [60]);
            await auction.connect(seller).ownerClaim();
            await auction.connect(bidder1).winnerClaim();
        });

        afterEach(async () => {
            // storage tests - unchanged
        });
    });

    describe('Auction Tests with ERC1155', () => {
        //define setup
        let testNFT: FactoryERC1155;
        let acceptableERC20Token: FactoryERC20;
        let EnglishAuctionAddress: string;
        let auction: EnglishAuction;
        let tokenId = 1;

        let originalERC20Balance: number;

        beforeEach(async () => {
            //Deploy ERC20 and ERC721
            [acceptableERC20Token] = await createERC20(1); //mints 1,000,000,000 by default
            [testNFT] = await createERC1155(1); //minting tokenIds 0-9; 100

            //predict deployment address
            EnglishAuctionAddress = await predictDeployClone(
                EnglishAuctionImplementation,
                [
                    //seller address
                    //NFT
                    //ERC20 Contract address (acceptable token)
                    //starting bid
                    //auction duration
                    //reset time
                    seller.address,
                    {
                        token: TokenType.erc1155,
                        contractAddr: testNFT.address,
                        tokenId: tokenId,
                    },
                    acceptableERC20Token.address,
                    2,
                    86400,
                    3600,
                    0,
                    owner.address,
                    gsnForwarderAddress,
                ],
                ERC1167Factory,
            );

            //Set Approval ERC1155 for sale
            await testNFT.connect(seller).setApprovalForAll(EnglishAuctionAddress, true);
            await acceptableERC20Token.connect(bidder1).approve(EnglishAuctionAddress, 100);
            await acceptableERC20Token.connect(bidder2).approve(EnglishAuctionAddress, 100);
            await acceptableERC20Token.connect(bidder3).approve(EnglishAuctionAddress, 100);

            // Transfer ERC20s to bidders
            await acceptableERC20Token.connect(seller).transfer(bidder1.address, 100);
            await acceptableERC20Token.connect(seller).transfer(bidder2.address, 100);
            await acceptableERC20Token.connect(seller).transfer(bidder3.address, 100);
            const totalERC20Minted: BigNumber = parseUnits('1000000000.0');
            expect(await acceptableERC20Token.balanceOf(seller.address)).to.equal(totalERC20Minted.sub(300));

            //deploy auction
            await deployClone(
                EnglishAuctionImplementation,
                [
                    //seller address
                    //NFT
                    //ERC20 Contract address (acceptable token)
                    //starting bid
                    //auction duration
                    //reset time
                    seller.address,
                    {
                        token: TokenType.erc1155,
                        contractAddr: testNFT.address,
                        tokenId: tokenId,
                    },
                    acceptableERC20Token.address,
                    2,
                    86400,
                    3600,
                    0,
                    owner.address,
                    gsnForwarderAddress,
                ],
                ERC1167Factory,
            );
            auction = (await ethers.getContractAt('EnglishAuction', EnglishAuctionAddress)) as EnglishAuction;

            //assert initial token amounts
            originalERC20Balance = 100;
            expect(await testNFT.balanceOf(seller.address, 1)).to.equal(99); //used to be 100 but is now 99
            expect(await testNFT.balanceOf(EnglishAuctionAddress, 1)).to.equal(1);
            expect(await acceptableERC20Token.balanceOf(bidder1.address)).to.equal(originalERC20Balance);
            expect(await acceptableERC20Token.balanceOf(bidder2.address)).to.equal(originalERC20Balance);
            expect(await acceptableERC20Token.balanceOf(bidder3.address)).to.equal(originalERC20Balance);
        });

        it('simple auction - 1 bidder', async () => {
            expect(await testNFT.balanceOf(auction.address, 1)).to.equal(1);
            expect(await testNFT.balanceOf(seller.address, 1)).to.equal(99);

            await auction.connect(bidder1).bid(5);
            expect(await acceptableERC20Token.balanceOf(bidder1.address)).to.equal(95);

            expect(await acceptableERC20Token.balanceOf(auction.address)).to.equal(5);

            await network.provider.send('evm_increaseTime', [86401]); //advance timestamp in seconds

            await auction.connect(seller).ownerClaim();
            await auction.connect(bidder1).winnerClaim();

            const totalERC20Minted: BigNumber = parseUnits('1000000000.0');
            expect(await acceptableERC20Token.balanceOf(seller.address)).to.equal(totalERC20Minted.sub(295));
            expect(await testNFT.balanceOf(bidder1.address, 1)).to.equal(1);
        });

        it('complex auction - two bidders', async () => {
            expect(await testNFT.balanceOf(auction.address, 1)).to.equal(1);
            expect(await testNFT.balanceOf(seller.address, 1)).to.equal(99);

            await auction.connect(bidder1).bid(5);

            expect(await acceptableERC20Token.balanceOf(bidder1.address)).to.equal(95);
            expect(await acceptableERC20Token.balanceOf(auction.address)).to.equal(5);

            await auction.connect(bidder2).bid(7);
            expect(await acceptableERC20Token.balanceOf(bidder2.address)).to.equal(93);
            expect(await acceptableERC20Token.balanceOf(auction.address)).to.equal(12);

            await auction.connect(bidder3).bid(10);
            expect(await acceptableERC20Token.balanceOf(bidder3.address)).to.equal(90);
            expect(await acceptableERC20Token.balanceOf(auction.address)).to.equal(22);

            await auction.connect(bidder1).bid(20);

            expect(await acceptableERC20Token.balanceOf(bidder1.address)).to.equal(80);
            expect(await acceptableERC20Token.balanceOf(auction.address)).to.equal(37);

            await network.provider.send('evm_increaseTime', [86401]); //advance timestamp in seconds

            await auction.connect(seller).ownerClaim();
            await auction.connect(bidder1).winnerClaim();

            const totalERC20Minted: BigNumber = parseUnits('1000000000.0');
            expect(await acceptableERC20Token.balanceOf(seller.address)).to.equal(totalERC20Minted.sub(280));
            expect(await testNFT.balanceOf(bidder1.address, 1)).to.equal(1);
            await expect(auction.connect(bidder1).withdraw()).to.be.revertedWith(
                'EnglishAuction: the highest bidder cannot withdraw!',
            );
            await auction.connect(bidder2).withdraw();
            await auction.connect(bidder3).withdraw();
            expect(await acceptableERC20Token.balanceOf(bidder1.address)).to.equal(80);
            expect(await acceptableERC20Token.balanceOf(bidder2.address)).to.equal(100);
            expect(await acceptableERC20Token.balanceOf(bidder3.address)).to.equal(100);
        });

        it('Owner claims with no bidder', async () => {
            await network.provider.send('evm_increaseTime', [86401]); //advance timestamp in seconds
            await auction.ownerClaim();
            expect(await testNFT.balanceOf(seller.address, 0)).to.equal(100);
        });

        it('error: bid too low', async () => {
            expect(await testNFT.balanceOf(auction.address, 1)).to.equal(1);
            expect(await testNFT.balanceOf(seller.address, 1)).to.equal(99);

            await auction.connect(bidder1).bid(5);
            expect(await acceptableERC20Token.balanceOf(bidder1.address)).to.equal(95);
            expect(await acceptableERC20Token.balanceOf(auction.address)).to.equal(5);

            await expect(auction.connect(bidder2).bid(3)).to.be.revertedWith('value <= highest');
        });

        it('error: bid after auction ends', async () => {
            expect(await testNFT.balanceOf(auction.address, 1)).to.equal(1);
            expect(await testNFT.balanceOf(seller.address, 1)).to.equal(99);

            await auction.connect(bidder1).bid(5);
            expect(await acceptableERC20Token.balanceOf(bidder1.address)).to.equal(95);
            expect(await acceptableERC20Token.balanceOf(auction.address)).to.equal(5);

            await network.provider.send('evm_increaseTime', [86401]); //advance timestamp in seconds

            await auction.connect(seller).ownerClaim();
            await auction.connect(bidder1).winnerClaim();
            await expect(auction.connect(bidder2).bid(7)).to.be.revertedWith('ended');
        });

        it('error: withdraw as highest bidder before ended', async () => {
            expect(await testNFT.balanceOf(auction.address, 1)).to.equal(1);
            expect(await testNFT.balanceOf(seller.address, 1)).to.equal(99);

            await auction.connect(bidder1).bid(5);
            expect(await acceptableERC20Token.balanceOf(bidder1.address)).to.equal(95);
            expect(await acceptableERC20Token.balanceOf(auction.address)).to.equal(5);

            await auction.connect(bidder2).bid(10);
            expect(await acceptableERC20Token.balanceOf(bidder2.address)).to.equal(90);
            expect(await acceptableERC20Token.balanceOf(auction.address)).to.equal(15);

            await expect(auction.connect(bidder2).withdraw()).to.be.revertedWith('the highest bidder cannot withdraw!');

            await network.provider.send('evm_increaseTime', [86401]); //advance timestamp in seconds

            await auction.connect(seller).ownerClaim();
            await auction.connect(bidder2).winnerClaim();

            const totalERC20Minted: BigNumber = parseUnits('1000000000.0');
            expect(await acceptableERC20Token.balanceOf(seller.address)).to.equal(totalERC20Minted.sub(290));
            await auction.connect(bidder1).withdraw();
            expect(await testNFT.balanceOf(bidder2.address, 1)).to.equal(1);
            expect(await acceptableERC20Token.balanceOf(bidder1.address)).to.equal(100);
            expect(await acceptableERC20Token.balanceOf(bidder2.address)).to.equal(90);
        });

        it('test reset time', async () => {
            expect(await testNFT.balanceOf(auction.address, 1)).to.equal(1);
            expect(await testNFT.balanceOf(seller.address, 1)).to.equal(99);

            await auction.connect(bidder1).bid(5);
            expect(await acceptableERC20Token.balanceOf(bidder1.address)).to.equal(95);
            expect(await acceptableERC20Token.balanceOf(auction.address)).to.equal(5);

            await auction.connect(bidder2).bid(10);
            expect(await acceptableERC20Token.balanceOf(bidder2.address)).to.equal(90);
            expect(await acceptableERC20Token.balanceOf(auction.address)).to.equal(15);

            await expect(auction.connect(bidder2).withdraw()).to.be.revertedWith('the highest bidder cannot withdraw!');

            await network.provider.send('evm_increaseTime', [82800]); //advance timestamp in seconds
            await expect(auction.connect(seller).ownerClaim()).to.be.revertedWith('not ended');
            await network.provider.send('evm_increaseTime', [60]);
            await auction.connect(bidder1).bid(15);
            await network.provider.send('evm_increaseTime', [3540]);
            await expect(auction.connect(seller).ownerClaim()).to.be.revertedWith('not ended');
            await network.provider.send('evm_increaseTime', [60]);
            await auction.connect(seller).ownerClaim();
            await auction.connect(bidder1).winnerClaim();
        });

        afterEach(async () => {
            // storage tests - unchanged
        });
    });
});

describe('EnglishAuction.sol 20% Fee', function () {
    //Extra time
    this.timeout(10000);
    let seller: TestingSigner;
    let bidder1: TestingSigner;
    let bidder2: TestingSigner;
    let bidder3: TestingSigner;
    let owner: TestingSigner;
    let marketplace: TestingSigner;
    let EnglishAuctionFactory: EnglishAuction__factory;
    let EnglishAuctionImplementation: EnglishAuction;

    let ERC1167FactoryFactory: ERC1167Factory__factory;
    let ERC1167Factory: ERC1167Factory;

    let gsnForwarderAddress = '0x0000000000000000000000000000000000000001';

    before(async () => {
        gsnForwarderAddress = await loadForwarder(ethers);

        //launch Auction + implementation
        EnglishAuctionFactory = (await ethers.getContractFactory('EnglishAuction')) as EnglishAuction__factory;
        EnglishAuctionImplementation = await EnglishAuctionFactory.deploy();

        // Launch ERC1167 Factory
        ERC1167FactoryFactory = (await ethers.getContractFactory('ERC1167Factory')) as ERC1167Factory__factory;
        ERC1167Factory = await ERC1167FactoryFactory.deploy();

        await Promise.all([ERC1167Factory.deployed(), EnglishAuctionImplementation.deployed()]);

        //get users (seller + bidder?)
        [seller, bidder1, bidder2, bidder3, owner, marketplace] = await loadSignersSmart(ethers);

    });

    describe('Auction Tests with ERC721', () => {
        //define setup

        let testNFT: FactoryERC721;
        let tokenId = 0;
        let acceptableERC20Token: FactoryERC20;
        let EnglishAuctionAddress: string;
        let auction: EnglishAuction;

        let originalERC20Balance: number;

        beforeEach(async () => {
            //Deploy ERC20 and ERC721
            [acceptableERC20Token] = await createERC20(1); //mints 1,000,000,000 by default
            [testNFT] = await createERC721(1, 1); //minting one token

            //Predict address
            EnglishAuctionAddress = await predictDeployClone(
                EnglishAuctionImplementation,
                [
                    //seller address
                    //NFT
                    //ERC20 Contract address (acceptable token)
                    //starting bid
                    //auction duration
                    //reset time
                    //sale fee
                    //sale fee address
                    seller.address,
                    {
                        token: TokenType.erc721,
                        contractAddr: testNFT.address,
                        tokenId,
                    },
                    acceptableERC20Token.address,
                    2,
                    86400,
                    3600,
                    20,
                    owner.address,
                    gsnForwarderAddress,
                ],
                ERC1167Factory,
            );

            //Set Approval ERC721 for sale
            await testNFT.connect(seller).approve(EnglishAuctionAddress, tokenId);
            await acceptableERC20Token.connect(bidder1).approve(EnglishAuctionAddress, 100);
            await acceptableERC20Token.connect(bidder2).approve(EnglishAuctionAddress, 100);
            await acceptableERC20Token.connect(bidder3).approve(EnglishAuctionAddress, 100);

            // Transfer ERC20s to bidders
            await acceptableERC20Token.connect(seller).transfer(bidder1.address, 100);
            await acceptableERC20Token.connect(seller).transfer(bidder2.address, 100);
            await acceptableERC20Token.connect(seller).transfer(bidder3.address, 100);
            const totalERC20Minted: BigNumber = parseUnits('1000000000.0');
            expect(await acceptableERC20Token.balanceOf(seller.address)).to.equal(totalERC20Minted.sub(300));

            //deploy auction
            await deployClone(
                EnglishAuctionImplementation,
                [
                    //seller address
                    //NFT
                    //ERC20 Contract address (acceptable token)
                    //starting bid
                    //auction duration
                    //reset time
                    //sale fee
                    //sale fee address
                    seller.address,
                    {
                        token: TokenType.erc721,
                        contractAddr: testNFT.address,
                        tokenId,
                    },
                    acceptableERC20Token.address,
                    2,
                    86400,
                    3600,
                    20,
                    owner.address,
                    gsnForwarderAddress,
                ],
                ERC1167Factory,
            );
            auction = (await ethers.getContractAt('EnglishAuction', EnglishAuctionAddress)) as EnglishAuction;

            //assert initial token amounts

            originalERC20Balance = 100;

            expect(await testNFT.balanceOf(seller.address)).to.equal(0);
            expect(await testNFT.balanceOf(EnglishAuctionAddress)).to.equal(1);
            expect(await acceptableERC20Token.balanceOf(bidder1.address)).to.equal(originalERC20Balance);
            expect(await acceptableERC20Token.balanceOf(bidder2.address)).to.equal(originalERC20Balance);
            expect(await acceptableERC20Token.balanceOf(bidder3.address)).to.equal(originalERC20Balance);
        });

        it('simple auction - 1 bidder', async () => {
            expect(await testNFT.balanceOf(auction.address)).to.equal(1);
            expect(await testNFT.balanceOf(seller.address)).to.equal(0);

            await auction.connect(bidder1).bid(5);
            expect(await acceptableERC20Token.balanceOf(bidder1.address)).to.equal(95);

            expect(await acceptableERC20Token.balanceOf(auction.address)).to.equal(5);

            await network.provider.send('evm_increaseTime', [86401]); //advance timestamp in seconds

            await auction.connect(seller).ownerClaim();
            await auction.connect(bidder1).winnerClaim();

            const totalERC20Minted: BigNumber = parseUnits('1000000000.0');
            expect(await acceptableERC20Token.balanceOf(seller.address)).to.equal(totalERC20Minted.sub(296));
            expect(await testNFT.balanceOf(bidder1.address)).to.equal(1);
            expect(await acceptableERC20Token.balanceOf(owner.address)).to.equal(1);
        });

        it('complex auction - two bidders', async () => {
            expect(await testNFT.balanceOf(auction.address)).to.equal(1);
            expect(await testNFT.balanceOf(seller.address)).to.equal(0);

            await auction.connect(bidder1).bid(5);

            expect(await acceptableERC20Token.balanceOf(bidder1.address)).to.equal(95);
            expect(await acceptableERC20Token.balanceOf(auction.address)).to.equal(5);

            await auction.connect(bidder2).bid(7);
            expect(await acceptableERC20Token.balanceOf(bidder2.address)).to.equal(93);
            expect(await acceptableERC20Token.balanceOf(auction.address)).to.equal(12);

            await auction.connect(bidder3).bid(10);
            expect(await acceptableERC20Token.balanceOf(bidder3.address)).to.equal(90);
            expect(await acceptableERC20Token.balanceOf(auction.address)).to.equal(22);

            await auction.connect(bidder1).bid(20);

            expect(await acceptableERC20Token.balanceOf(bidder1.address)).to.equal(80);
            expect(await acceptableERC20Token.balanceOf(auction.address)).to.equal(37);

            await network.provider.send('evm_increaseTime', [86401]); //advance timestamp in seconds

            await auction.connect(seller).ownerClaim();
            await auction.connect(bidder1).winnerClaim();

            const totalERC20Minted: BigNumber = parseUnits('1000000000.0');
            expect(await acceptableERC20Token.balanceOf(seller.address)).to.equal(totalERC20Minted.sub(284));
            expect(await acceptableERC20Token.balanceOf(owner.address)).to.equal(4);
            expect(await testNFT.balanceOf(bidder1.address)).to.equal(1);
            await expect(auction.connect(bidder1).withdraw()).to.be.revertedWith(
                'EnglishAuction: the highest bidder cannot withdraw!',
            );
            await auction.connect(bidder2).withdraw();
            await auction.connect(bidder3).withdraw();
            expect(await acceptableERC20Token.balanceOf(bidder1.address)).to.equal(80);
            expect(await acceptableERC20Token.balanceOf(bidder2.address)).to.equal(100);
            expect(await acceptableERC20Token.balanceOf(bidder3.address)).to.equal(100);
        });

        it('Owner claims with no bidder', async () => {
            await network.provider.send('evm_increaseTime', [86401]); //advance timestamp in seconds
            await auction.ownerClaim();
            expect(await testNFT.ownerOf(0)).to.equal(seller.address);
        });

        it('beacon proxy initialization', async () => {
            const [testNFT2] = await createERC721(1);

            const beaconFactory = (await ethers.getContractFactory(
                'UpgradeableBeaconInitializable',
            )) as UpgradeableBeaconInitializable__factory;
            const beaconImpl = (await beaconFactory.deploy()) as UpgradeableBeaconInitializable;

            const beaconProxyFactory = (await ethers.getContractFactory(
                'BeaconProxyInitializable',
            )) as BeaconProxyInitializable__factory;
            const beaconProxyImpl = (await beaconProxyFactory.deploy()) as BeaconProxyInitializable;

            const { address: beaconAddr } = await deployClone(beaconImpl, [seller.address, EnglishAuctionImplementation.address], ERC1167Factory);
            //@ts-ignore
            const data = EnglishAuctionImplementation.interface.encodeFunctionData('proxyInitialize',
                [
                    //seller address
                    //NFT
                    //ERC20 Contract address (acceptable token)
                    //starting bid
                    //auction duration
                    //reset time
                    //sale fee
                    //sale fee address
                    seller.address,
                    {
                        token: TokenType.erc721,
                        contractAddr: testNFT2.address,
                        tokenId,
                    },
                    acceptableERC20Token.address,
                    2,
                    86400,
                    3600,
                    20,
                    owner.address,
                    gsnForwarderAddress,
                ])
            const beaconProxyAddr = await predictDeployClone(beaconProxyImpl, [seller.address, beaconAddr, data], ERC1167Factory);
            //Set Approval ERC721 for sale

            await testNFT2.connect(seller).approve(beaconProxyAddr, tokenId);
            await deployClone(beaconProxyImpl, [seller.address, beaconAddr, data], ERC1167Factory);
            const contrInst = (await ethers.getContractAt('EnglishAuction', beaconProxyAddr)) as EnglishAuction;

            //transformer doesn't have only dna role
            contrInst.connect(bidder1).bid(2);
        });
    });

    describe('Initialization revert tests', () => {
        //define setup
        let testNFT: FactoryERC721;
        let tokenId = 0;
        let acceptableERC20Token: FactoryERC20;
        let EnglishAuctionAddress: string;
        let auction: EnglishAuction;

        let originalERC20Balance: number;

        beforeEach(async () => {
            //Deploy ERC20 and ERC721
            [acceptableERC20Token] = await createERC20(1); //mints 1,000,000,000 by default
            [testNFT] = await createERC721(1, 1); //minting one token
        });

        it('Unsupported token type', async () => {
            await expect(deployClone(
                EnglishAuctionImplementation,
                [
                    //seller address
                    //NFT
                    //ERC20 Contract address (acceptable token)
                    //starting bid
                    //auction duration
                    //reset time
                    //sale fee
                    //sale fee address
                    seller.address,
                    {
                        token: 5,
                        contractAddr: testNFT.address,
                        tokenId,
                    },
                    acceptableERC20Token.address,
                    2,
                    86400,
                    3600,
                    20,
                    owner.address,
                    gsnForwarderAddress,
                ],
                ERC1167Factory,
            )).to.be.revertedWith('');
        });

        it('Sale fee over 100', async () => {
            await expect(deployClone(
                EnglishAuctionImplementation,
                [
                    //seller address
                    //NFT
                    //ERC20 Contract address (acceptable token)
                    //starting bid
                    //auction duration
                    //reset time
                    //sale fee
                    //sale fee address
                    seller.address,
                    {
                        token: TokenType.erc721,
                        contractAddr: testNFT.address,
                        tokenId,
                    },
                    acceptableERC20Token.address,
                    2,
                    86400,
                    3600,
                    200,
                    owner.address,
                    gsnForwarderAddress,
                ],
                ERC1167Factory,
            )).to.be.revertedWith('EnglishAuction: saleFee cannot be above 100 percent!');
        });
    });

    describe('Function revert tests', () => {
        //define setup
        let testNFT: FactoryERC721;
        let tokenId = 0;
        let acceptableERC20Token: FactoryERC20;
        let EnglishAuctionAddress: string;
        let auction: EnglishAuction;

        beforeEach(async () => {
            //Deploy ERC20 and ERC721
            [acceptableERC20Token] = await createERC20(1); //mints 1,000,000,000 by default
            [testNFT] = await createERC721(1, 1); //minting one token
            //predict deployment address
            EnglishAuctionAddress = await predictDeployClone(
                EnglishAuctionImplementation,
                [
                    //seller address
                    //NFT
                    //ERC20 Contract address (acceptable token)
                    //starting bid
                    //auction duration
                    //reset time
                    //sale fee
                    //sale fee address
                    seller.address,
                    {
                        token: TokenType.erc721,
                        contractAddr: testNFT.address,
                        tokenId: tokenId,
                    },
                    acceptableERC20Token.address,
                    2,
                    86400,
                    3600,
                    0,
                    owner.address,
                    gsnForwarderAddress,
                ],
                ERC1167Factory,
            );

            //Set Approval
            await testNFT.connect(seller).setApprovalForAll(EnglishAuctionAddress, true);

            //deploy auction
            await deployClone(
                EnglishAuctionImplementation,
                [
                    //seller address
                    //NFT
                    //ERC20 Contract address (acceptable token)
                    //starting bid
                    //auction duration
                    //reset time
                    //sale fee
                    //sale fee address
                    seller.address,
                    {
                        token: TokenType.erc721,
                        contractAddr: testNFT.address,
                        tokenId: tokenId,
                    },
                    acceptableERC20Token.address,
                    2,
                    86400,
                    3600,
                    0,
                    owner.address,
                    gsnForwarderAddress,
                ],
                ERC1167Factory,
            );
            auction = (await ethers.getContractAt('EnglishAuction', EnglishAuctionAddress)) as EnglishAuction;
        });

        it('Owner claims when already claimed', async () => {
            await network.provider.send('evm_increaseTime', [86401]); //advance timestamp in seconds
            await auction.ownerClaim();
            await expect(auction.ownerClaim()).to.be.revertedWith('EnglishAuction: owner has already claimed');
        });

        it('Winner claims when auction not ended', async () => {
            await expect(auction.winnerClaim()).to.be.revertedWith('EnglishAuction: not ended');
        });

        it('Winner claims when already claimed', async () => {
            await acceptableERC20Token.connect(seller).approve(auction.address, 999);
            expect(await auction.getRemainingTime()).to.equal(86399);
            await (await auction.bid(5));
            expect(await auction.getCurrentBid()).to.equal(5);
            await network.provider.send('evm_increaseTime', [86401]); //advance timestamp in seconds
            await network.provider.send('evm_mine');
            expect(await auction.getRemainingTime()).to.equal(0);
            await auction.winnerClaim();
            await expect(auction.winnerClaim()).to.be.revertedWith('EnglishAuction: winner has already claimed');
        });
        it('Non highest bidder attempts to claim', async () => {
            await acceptableERC20Token.connect(seller).approve(auction.address, 999);
            await auction.bid(5);
            await network.provider.send('evm_increaseTime', [86401]); //advance timestamp in seconds
            await expect(auction.connect(bidder2).winnerClaim()).to.be.revertedWith('EnglishAuction: you are not the winner, you cannot claim!');
        });
    });

    describe('Royalty fee test ERC721Owl', () => {
        //define setup
        let testNFTFactory: ERC721Owl__factory
        let testNFTImpl: ERC721Owl;
        let testNFTInst: ERC721Owl;
        const tokenId = 0;
        let acceptableERC20Token: FactoryERC20;
        let EnglishAuctionAddress: string;

        const totalERC20Minted = parseUnits('1.0', 27);

        let auction: EnglishAuction;

        beforeEach(async () => {
            //Deploy ERC20 and ERC721
            [acceptableERC20Token] = await createERC20(); //mints 1e9 tokens

            // Deploy test Owl 
            testNFTFactory = (await ethers.getContractFactory('ERC721Owl')) as ERC721Owl__factory;
            testNFTImpl = await testNFTFactory.deploy();
            const { address } = await deployClone(testNFTImpl,
                [owner.address, 'n', 's', 'u', gsnForwarderAddress, owner.address, 3000], ERC1167Factory);
            testNFTInst = await (ethers.getContractAt('ERC721Owl', address)) as ERC721Owl;
            await testNFTInst.connect(owner).mint(seller.address, tokenId);


            //predict deployment address
            EnglishAuctionAddress = await predictDeployClone(
                EnglishAuctionImplementation,
                [
                    //seller address
                    //NFT
                    //ERC20 Contract address (acceptable token)
                    //starting bid
                    //auction duration
                    //reset time
                    //sale fee
                    //sale fee address
                    seller.address,
                    {
                        token: TokenType.erc721,
                        contractAddr: testNFTInst.address,
                        tokenId,
                    },
                    acceptableERC20Token.address,
                    100, //in "wei"
                    300,
                    60,
                    20,
                    marketplace.address,
                    gsnForwarderAddress,
                ],
                ERC1167Factory,
            );

            await acceptableERC20Token.connect(bidder1).approve(EnglishAuctionAddress, parseUnits('1.0', 27));

            // Transfer ERC20s to bidders
            await acceptableERC20Token.connect(seller).transfer(bidder1.address, parseUnits('1.0', 27));

            // Set Approval ERC721 for sale
            await testNFTInst.connect(seller).approve(EnglishAuctionAddress, tokenId);

            // Deploy contract
            auction = (
                await deployCloneWrap(
                    EnglishAuctionImplementation,
                    [
                        //seller address
                        //NFT
                        //ERC20 Contract address (acceptable token)
                        //starting bid
                        //auction duration
                        //reset time
                        //sale fee
                        //sale fee address
                        seller.address,
                        {
                            token: TokenType.erc721,
                            contractAddr: testNFTInst.address,
                            tokenId,
                        },
                        acceptableERC20Token.address,
                        100, //in "wei"
                        300,
                        60,
                        20,
                        marketplace.address,
                        gsnForwarderAddress
                    ],
                    ERC1167Factory
                )
            ).contract as EnglishAuction;

            //assert initial token amounts
            expect(await acceptableERC20Token.balanceOf(seller.address)).to.equal(0);

            expect(await testNFTInst.balanceOf(seller.address)).to.equal(0);
            expect(await testNFTInst.balanceOf(EnglishAuctionAddress)).to.equal(1);
            expect(await acceptableERC20Token.balanceOf(bidder1.address)).to.equal(totalERC20Minted);
        });

        it('Test Bid', async () => {
            await auction.connect(bidder1).bid(100);
            expect(await acceptableERC20Token.balanceOf(bidder1.address)).to.equal(totalERC20Minted.sub(100));

            expect(await acceptableERC20Token.balanceOf(auction.address)).to.equal(100);

            await network.provider.send('evm_increaseTime', [500]); //advance timestamp in seconds

            await auction.connect(seller).ownerClaim();
            await auction.connect(bidder1).winnerClaim();


            expect(await testNFTInst.balanceOf(bidder1.address)).to.equal(1);
            expect(await acceptableERC20Token.balanceOf(owner.address)).to.equal(30);
            expect(await acceptableERC20Token.balanceOf(marketplace.address)).to.equal(20);
            expect(await acceptableERC20Token.balanceOf(seller.address)).to.equal(50);
        });
    });

    describe('Royalty fee test ERC1155Owl', () => {
        //define setup
        let test1155Factory: ERC1155Owl__factory;
        let test1155Impl: ERC1155Owl;
        let test1155Inst: ERC1155Owl;
        const tokenId = 0;
        let acceptableERC20Token: FactoryERC20;
        let EnglishAuctionAddress: string;

        const totalERC20Minted = parseUnits('1.0', 27);

        let auction: EnglishAuction;

        beforeEach(async () => {
            //Deploy ERC20 and ERC721
            [acceptableERC20Token] = await createERC20(); //mints 1e9 tokens

            // Deploy test Owl 
            test1155Factory = (await ethers.getContractFactory('ERC1155Owl')) as ERC1155Owl__factory;
            test1155Impl = await test1155Factory.deploy();
            const { address } = await deployClone(test1155Impl,
                [owner.address, 'n', 's', gsnForwarderAddress, owner.address, 3000], ERC1167Factory);
            test1155Inst = await (ethers.getContractAt('ERC1155Owl', address)) as ERC1155Owl;
            await test1155Inst.connect(owner).mint(seller.address, tokenId, 1, '0x');


            //predict deployment address
            EnglishAuctionAddress = await predictDeployClone(
                EnglishAuctionImplementation,
                [
                    //seller address
                    //NFT
                    //ERC20 Contract address (acceptable token)
                    //starting bid
                    //auction duration
                    //reset time
                    //sale fee
                    //sale fee address
                    seller.address,
                    {
                        token: TokenType.erc1155,
                        contractAddr: test1155Inst.address,
                        tokenId,
                    },
                    acceptableERC20Token.address,
                    100, //in "wei"
                    300,
                    60,
                    20,
                    marketplace.address,
                    gsnForwarderAddress,
                ],
                ERC1167Factory,
            );

            await acceptableERC20Token.connect(bidder1).approve(EnglishAuctionAddress, parseUnits('1.0', 27));

            // Transfer ERC20s to bidders
            await acceptableERC20Token.connect(seller).transfer(bidder1.address, parseUnits('1.0', 27));

            // Set Approval ERC721 for sale
            await test1155Inst.connect(seller).setApprovalForAll(EnglishAuctionAddress, true);

            // Deploy contract
            auction = (
                await deployCloneWrap(
                    EnglishAuctionImplementation,
                    [
                        //seller address
                        //NFT
                        //ERC20 Contract address (acceptable token)
                        //starting bid
                        //auction duration
                        //reset time
                        //sale fee
                        //sale fee address
                        seller.address,
                        {
                            token: TokenType.erc1155,
                            contractAddr: test1155Inst.address,
                            tokenId,
                        },
                        acceptableERC20Token.address,
                        100, //in "wei"
                        300,
                        60,
                        20,
                        marketplace.address,
                        gsnForwarderAddress
                    ],
                    ERC1167Factory
                )
            ).contract as EnglishAuction;

            //assert initial token amounts
            expect(await acceptableERC20Token.balanceOf(seller.address)).to.equal(0);

            expect(await test1155Inst.balanceOf(seller.address, tokenId)).to.equal(0);
            expect(await test1155Inst.balanceOf(EnglishAuctionAddress, tokenId)).to.equal(1);
            expect(await acceptableERC20Token.balanceOf(bidder1.address)).to.equal(totalERC20Minted);
        });

        it('Test Bid', async () => {
            await auction.connect(bidder1).bid(100);
            expect(await acceptableERC20Token.balanceOf(bidder1.address)).to.equal(totalERC20Minted.sub(100));

            expect(await acceptableERC20Token.balanceOf(auction.address)).to.equal(100);

            await network.provider.send('evm_increaseTime', [500]); //advance timestamp in seconds

            await auction.connect(seller).ownerClaim();
            await auction.connect(bidder1).winnerClaim();


            expect(await test1155Inst.balanceOf(bidder1.address, tokenId)).to.equal(1);
            expect(await acceptableERC20Token.balanceOf(owner.address)).to.equal(30);
            expect(await acceptableERC20Token.balanceOf(marketplace.address)).to.equal(20);
            expect(await acceptableERC20Token.balanceOf(seller.address)).to.equal(50);
        });
    });
});
