import { ethers, network } from 'hardhat';
const { utils } = ethers;
const { parseUnits } = utils;
import { expect } from 'chai';
import { SignerWithAddress } from '@nomiclabs/hardhat-ethers/signers';
import {
    DutchAuction,
    DutchAuction__factory,
    ERC20,
    ERC1167Factory,
    ERC1167Factory__factory,
    ERC721,
} from '../../typechain';

import { createERC20, createERC721 } from '../utils';
import { BigNumber } from 'ethers';

describe('DutchAuction.sol', function () {
    //Extra time
    this.timeout(10000);
    let seller: SignerWithAddress;
    let bidder1: SignerWithAddress;

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
        [seller, bidder1] = await ethers.getSigners();
    });

    describe('Auction Tests', () => {
        //define setup
        let testNFT: ERC721;
        let acceptableERC20Token: ERC20;
        let DutchAuctionAddress: string;
        let auction: DutchAuction;

        let originalERC20Balance: number;

        beforeEach(async () => {
            //Deploy ERC20 and ERC721
            [acceptableERC20Token] = await createERC20(1); //mints 1,000,000,000 by default
            [testNFT] = await createERC721(1, 1); //minting one token

            //DutchAuction Data
            const DutchAuctionData = DutchAuctionImplementation.interface.encodeFunctionData('initialize', [
                //seller address
                //NFT address
                //NFT ID
                //ERC20 Contract address (acceptable token)
                //start price
                //end price
                //auction duration
                seller.address,
                testNFT.address,
                1,
                acceptableERC20Token.address,
                100,
                10,
                300,
            ]);

            //Predict address
            const salt = ethers.utils.formatBytes32String('1');
            DutchAuctionAddress = await ERC1167Factory.predictDeterministicAddress(
                DutchAuctionImplementation.address,
                salt,
                DutchAuctionData,
            );

            //need to look at three things now: seller, the contract, and the bidder
            //as well as two assets: the NFT, and the ERC 20 token

            //Set Approval ERC721 for sale
            await testNFT.connect(seller).approve(DutchAuctionAddress, 1);
            await acceptableERC20Token.connect(bidder1).approve(DutchAuctionAddress, 100);

            // Transfer ERC20s to bidders
            await acceptableERC20Token.connect(seller).transfer(bidder1.address, 100);

            const totalERC20Minted: BigNumber = parseUnits('1000000000.0');
            expect(await acceptableERC20Token.balanceOf(seller.address)).to.equal(totalERC20Minted.sub(100));

            //deploy auction
            //check balances
            ///clone deterministic
            await ERC1167Factory.cloneDeterministic(DutchAuctionImplementation.address, salt, DutchAuctionData);
            auction = (await ethers.getContractAt('DutchAuction', DutchAuctionAddress)) as DutchAuction;

            //assert initial token amounts

            originalERC20Balance = 100;

            expect(await testNFT.balanceOf(seller.address)).to.equal(0);
            expect(await testNFT.balanceOf(DutchAuctionAddress)).to.equal(1);
            expect(await acceptableERC20Token.balanceOf(bidder1.address)).to.equal(originalERC20Balance);

            //storage tests
        });

        it('simple auction - 1 bidder', async () => {
            
            await auction.start();

            expect(await testNFT.balanceOf(auction.address)).to.equal(1);
            expect(await testNFT.balanceOf(seller.address)).to.equal(0);

            expect(await auction.getCurrentPrice()).to.equal(parseUnits("100.0", 18));
            await network.provider.send('evm_increaseTime', [23]); //advance timestamp in seconds
            await network.provider.send("evm_mine");
            expect(await auction.getCurrentPrice()).to.equal(parseUnits("92.500000000000000030", 18));
            await network.provider.send('evm_increaseTime', [25]); //advance timestamp in seconds
            await network.provider.send("evm_mine");
            expect(await auction.getCurrentPrice()).to.equal(90);
            //await auction.connect(bidder1).bid(100);
            //expect(await acceptableERC20Token.balanceOf(bidder1.address)).to.equal(95);
            //expect(await acceptableERC20Token.balanceOf(auction.address)).to.equal(5);
        });

        it('simple auction - no bidder, auction ends', async () => {
            //await auction.withdraw();
            await auction.start();
            expect(await testNFT.balanceOf(auction.address)).to.equal(1);
            expect(await testNFT.balanceOf(seller.address)).to.equal(0);

            //await network.provider.send('evm_increaseTime', [82800]); //advance timestamp in seconds
           // await auction.transfer();
        });

        it('error: bid too low', async () => {
            await auction.start();
            //add increase time
            //add expect for what the current price should be

            //make below line a bid lower than current price
            await expect(auction.connect(bidder1).bid(55)).to.be.revertedWith('must bid the current price');
        });

        it('error: bid too high', async () => {
            await auction.start();
            //add increase time
            //add expect for what the current price should be

            //make below line a bid higher than current price
            await expect(auction.connect(bidder1).bid(55)).to.be.revertedWith('must bid the current price');
        });

        it('error: bid lower than endPrice', async () => {
            await auction.start();
            //add increase time
            //add expect for what the current price should be

            await expect(auction.connect(bidder1).bid(5)).to.be.revertedWith('cannot bid lower than lowest possible price');
        });

        it('error: bid after auction ends', async () => {
            await auction.start();
            //add increase time to finish the auction
            //add expect for what current price should be -> should be 10?
            await auction.transfer();
            await expect(auction.connect(bidder1).bid(50)).to.be.revertedWith('ended');
        });

        afterEach(async () => {
            // storage tests - unchanged
        });
    });
});
