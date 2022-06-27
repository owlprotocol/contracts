import { ethers, network } from 'hardhat';
const { utils } = ethers;
const { parseUnits } = utils;
import { expect } from 'chai';
import { SignerWithAddress } from '@nomiclabs/hardhat-ethers/signers';
//import _, { pick } from 'lodash';
import {
    EnglishAuction,
    EnglishAuction__factory,
    ERC20,
    ERC1167Factory,
    ERC1167Factory__factory,
    ERC721,
    ERC1155,
} from '../../typechain';

import { createERC20, createERC721, createERC1155 } from '../utils';
import { BigNumber } from 'ethers';

enum TokenType {
    erc721,
    erc1155,
}

describe('EnglishAuction.sol', function () {
    //Extra time
    this.timeout(10000);
    let seller: SignerWithAddress;
    let bidder1: SignerWithAddress;
    let bidder2: SignerWithAddress;
    let bidder3: SignerWithAddress;
    let EnglishAuctionFactory: EnglishAuction__factory;
    let EnglishAuctionImplementation: EnglishAuction;

    let ERC1167FactoryFactory: ERC1167Factory__factory;
    let ERC1167Factory: ERC1167Factory;

    before(async () => {
        //launch Auction + implementation
        EnglishAuctionFactory = (await ethers.getContractFactory('EnglishAuction')) as EnglishAuction__factory;
        EnglishAuctionImplementation = await EnglishAuctionFactory.deploy();

        // Launch ERC1167 Factory
        ERC1167FactoryFactory = (await ethers.getContractFactory('ERC1167Factory')) as ERC1167Factory__factory;
        ERC1167Factory = await ERC1167FactoryFactory.deploy();

        await Promise.all([ERC1167Factory.deployed(), EnglishAuctionImplementation.deployed()]);

        //get users (seller + bidder?)
        [seller, bidder1, bidder2, bidder3] = await ethers.getSigners();
    });

    describe('Auction Tests with ERC721', () => {
        //define setup

        let testNFT: ERC721;
        let acceptableERC20Token: ERC20;
        let EnglishAuctionAddress: string;
        let auction: EnglishAuction;

        let originalERC20Balance: number;

        beforeEach(async () => {
            //Deploy ERC20 and ERC721
            [acceptableERC20Token] = await createERC20(1); //mints 1,000,000,000 by default
            [testNFT] = await createERC721(1, 1); //minting one token

            //EnglishAuction Data
            const EnglishAuctionData = EnglishAuctionImplementation.interface.encodeFunctionData('initialize', [
                //seller address
                //NFT
                //ERC20 Contract address (acceptable token)
                //starting bid
                //auction duration
                //reset time
                seller.address,
                {
                    token: TokenType.erc721,
                    contractAddr: testNFT.address,
                    tokenId: 1,
                },
                acceptableERC20Token.address,
                2,
                86400,
                3600,
            ]);

            //Predict address
            const salt = ethers.utils.formatBytes32String('1');
            EnglishAuctionAddress = await ERC1167Factory.predictDeterministicAddress(
                EnglishAuctionImplementation.address,
                salt,
                EnglishAuctionData,
            );

            //need to look at three things now: seller, the contract, and the bidder
            //as well as two assets: the NFT, and the ERC 20 token

            //Set Approval ERC721 for sale

            await testNFT.connect(seller).approve(EnglishAuctionAddress, 1);
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
            //check balances
            ///clone deterministic
            await ERC1167Factory.cloneDeterministic(EnglishAuctionImplementation.address, salt, EnglishAuctionData);
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
            await auction.start();
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
        });

        it('complex auction - two bidders', async () => {
            await auction.start();

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
            await auction.start();

            expect(await testNFT.balanceOf(auction.address)).to.equal(1);
            expect(await testNFT.balanceOf(seller.address)).to.equal(0);

            await auction.connect(bidder1).bid(5);
            expect(await acceptableERC20Token.balanceOf(bidder1.address)).to.equal(95);
            expect(await acceptableERC20Token.balanceOf(auction.address)).to.equal(5);

            await expect(auction.connect(bidder2).bid(3)).to.be.revertedWith('value <= highest');
        });

        it('error: bid after auction ends', async () => {
            await auction.start();
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
            await auction.start();
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
            await auction.start();
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

        let testNFT: ERC1155;
        let acceptableERC20Token: ERC20;
        let EnglishAuctionAddress: string;
        let auction: EnglishAuction;

        let originalERC20Balance: number;

        beforeEach(async () => {
            //Deploy ERC20 and ERC721
            [acceptableERC20Token] = await createERC20(1); //mints 1,000,000,000 by default
            [testNFT] = await createERC1155(1); //minting tokenIds 0-9; 100

            //EnglishAuction Data
            const EnglishAuctionData = EnglishAuctionImplementation.interface.encodeFunctionData('initialize', [
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
                    tokenId: 1,
                },
                acceptableERC20Token.address,
                2,
                86400,
                3600,
            ]);

            //Predict address
            const salt = ethers.utils.formatBytes32String('1');
            EnglishAuctionAddress = await ERC1167Factory.predictDeterministicAddress(
                EnglishAuctionImplementation.address,
                salt,
                EnglishAuctionData,
            );

            //need to look at three things now: seller, the contract, and the bidder
            //as well as two assets: the NFT, and the ERC 20 token

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
            //check balances
            ///clone deterministic
            await ERC1167Factory.cloneDeterministic(EnglishAuctionImplementation.address, salt, EnglishAuctionData);
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
            await auction.start();
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
            await auction.start();

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

        it('error: bid too low', async () => {
            await auction.start();

            expect(await testNFT.balanceOf(auction.address, 1)).to.equal(1);
            expect(await testNFT.balanceOf(seller.address, 1)).to.equal(99);

            await auction.connect(bidder1).bid(5);
            expect(await acceptableERC20Token.balanceOf(bidder1.address)).to.equal(95);
            expect(await acceptableERC20Token.balanceOf(auction.address)).to.equal(5);

            await expect(auction.connect(bidder2).bid(3)).to.be.revertedWith('value <= highest');
        });

        it('error: bid after auction ends', async () => {
            await auction.start();
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
            await auction.start();
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
            await auction.start();
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
