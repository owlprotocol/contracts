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
    this.timeout(100000);
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

    describe('Linear Auction Tests', () => {
        //define setup
        let testNFT: ERC721;
        let acceptableERC20Token: ERC20;
        let DutchAuctionAddress: string;
        let auction: DutchAuction;

        let originalERC20Balance: BigNumber;

        beforeEach(async () => {
            //Deploy ERC20 and ERC721
            [acceptableERC20Token] = await createERC20(); //mints 1e9 tokens
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
                //isNonLinear
                seller.address,
                testNFT.address,
                1,
                acceptableERC20Token.address,
                100, //in "eth"
                10,
                300,
                false,
                0,
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
            await acceptableERC20Token.connect(bidder1).approve(DutchAuctionAddress, parseUnits('100.0', 18));

            // Transfer ERC20s to bidders
            await acceptableERC20Token.connect(seller).transfer(bidder1.address, parseUnits('100.0', 18));

            const totalERC20Minted: BigNumber = parseUnits('1.0', 27);
            expect(await acceptableERC20Token.balanceOf(seller.address)).to.equal(
                totalERC20Minted.sub(parseUnits('100.0', 18)),
            );

            //deploy auction
            //check balances
            ///clone deterministic
            await ERC1167Factory.cloneDeterministic(DutchAuctionImplementation.address, salt, DutchAuctionData);
            auction = (await ethers.getContractAt('DutchAuction', DutchAuctionAddress)) as DutchAuction;

            //assert initial token amounts

            originalERC20Balance = parseUnits('100.0', 18);

            expect(await testNFT.balanceOf(seller.address)).to.equal(0);
            expect(await testNFT.balanceOf(DutchAuctionAddress)).to.equal(1);
            expect(await acceptableERC20Token.balanceOf(bidder1.address)).to.equal(originalERC20Balance);

            //storage tests
        });

        it('simple auction - 1 bidder', async () => {
            const tx = await auction.start();
            await tx.wait();

            expect(await testNFT.balanceOf(auction.address)).to.equal(1);
            expect(await testNFT.balanceOf(seller.address)).to.equal(0);

            expect(await auction.getCurrentPrice()).to.equal(parseUnits('100.0', 18));
            await network.provider.send('evm_increaseTime', [23]); //advance timestamp in seconds
            await network.provider.send('evm_mine');
            expect(await auction.getCurrentPrice()).to.equal(parseUnits('93.100000000000000060', 18));
            await network.provider.send('evm_increaseTime', [25]); //advance timestamp in seconds
            await network.provider.send('evm_mine');

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
        });

        it('simple auction - no bidder, auction ends', async () => {
            //await auction.withdraw();
            const tx = await auction.start();
            await tx.wait();

            expect(await testNFT.balanceOf(auction.address)).to.equal(1);
            expect(await testNFT.balanceOf(seller.address)).to.equal(0);

            await network.provider.send('evm_increaseTime', [300]); //advance timestamp in seconds
            await network.provider.send('evm_mine');
            expect(await auction.getCurrentPrice()).to.equal(parseUnits('10.0', 18));
            await auction.claim();

            expect(await testNFT.balanceOf(seller.address)).to.equal(1);
            expect(await testNFT.balanceOf(auction.address)).to.equal(0);
        });

        it('error: bid after auction ends', async () => {
            const tx = await auction.start();
            await tx.wait();

            await network.provider.send('evm_increaseTime', [300]); //advance timestamp in seconds
            await network.provider.send('evm_mine');
            expect(await auction.getCurrentPrice()).to.equal(parseUnits('10.0', 18));
            await expect(auction.connect(bidder1).bid()).to.be.revertedWith('DutchAuction: ended');
        });
        it('visual price change', async () => {
            const tx = await auction.start();
            await tx.wait();

            expect(await testNFT.balanceOf(auction.address)).to.equal(1);
            expect(await testNFT.balanceOf(seller.address)).to.equal(0);

            expect(await auction.getCurrentPrice()).to.equal(parseUnits('100.0', 18));

            //console.log('hi');
            for (let i = 0; i < 300; i++) {
                await network.provider.send('evm_increaseTime', [1]); //advance timestamp in seconds
                await network.provider.send('evm_mine');
                console.log(ethers.utils.formatEther(await auction.getCurrentPrice()));

                //expect(await auction.getCurrentPrice()).to.equal(parseUnits('10.0', 18));
            }
        });
        afterEach(async () => {
            // storage tests - unchanged
        });
    });

    describe('Nonlinear Auction Tests', () => {
        //define setup
        let testNFT: ERC721;
        let acceptableERC20Token: ERC20;
        let DutchAuctionAddress: string;
        let auction: DutchAuction;

        let originalERC20Balance: BigNumber;

        beforeEach(async () => {
            //Deploy ERC20 and ERC721
            [acceptableERC20Token] = await createERC20(); //mints 1e9 tokens
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
                //isNonLinear
                //priceChangeTimeInterval
                seller.address,
                testNFT.address,
                1,
                acceptableERC20Token.address,
                100, //in "eth"
                10,
                300,
                true,
                0,
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
            await acceptableERC20Token.connect(bidder1).approve(DutchAuctionAddress, parseUnits('100.0', 18));

            // Transfer ERC20s to bidders
            await acceptableERC20Token.connect(seller).transfer(bidder1.address, parseUnits('100.0', 18));

            const totalERC20Minted: BigNumber = parseUnits('1.0', 27);
            expect(await acceptableERC20Token.balanceOf(seller.address)).to.equal(
                totalERC20Minted.sub(parseUnits('100.0', 18)),
            );

            //deploy auction
            //check balances
            ///clone deterministic
            await ERC1167Factory.cloneDeterministic(DutchAuctionImplementation.address, salt, DutchAuctionData);
            auction = (await ethers.getContractAt('DutchAuction', DutchAuctionAddress)) as DutchAuction;

            //assert initial token amounts

            originalERC20Balance = parseUnits('100.0', 18);

            expect(await testNFT.balanceOf(seller.address)).to.equal(0);
            expect(await testNFT.balanceOf(DutchAuctionAddress)).to.equal(1);
            expect(await acceptableERC20Token.balanceOf(bidder1.address)).to.equal(originalERC20Balance);

            //storage tests
        });

        it('simple auction - 1 bidder', async () => {
            const tx = await auction.start();
            await tx.wait();

            expect(await testNFT.balanceOf(auction.address)).to.equal(1);
            expect(await testNFT.balanceOf(seller.address)).to.equal(0);

            expect(await auction.getCurrentPrice()).to.equal(parseUnits('100.0', 18));

            //console.log('hi');
            await network.provider.send('evm_increaseTime', [23]); //advance timestamp in seconds
            await network.provider.send('evm_mine');
            expect(await auction.getCurrentPrice()).to.equal(parseUnits('99.588030683856107275', 18));
            await network.provider.send('evm_increaseTime', [25]); //advance timestamp in seconds
            await network.provider.send('evm_mine');

            const sellerBalance = await acceptableERC20Token.balanceOf(seller.address);
            const tx2 = await auction.connect(bidder1).bid();
            await tx2.wait();
            expect(await auction.getCurrentPrice()).to.equal(parseUnits('98.914582838240080159', 18));

            const balance: BigNumber = parseUnits('100.0', 18);
            expect(await acceptableERC20Token.balanceOf(bidder1.address)).to.equal(
                balance.sub(parseUnits('98.914582838240080159', 18)),
            );
            expect(await acceptableERC20Token.balanceOf(seller.address)).to.equal(
                sellerBalance.add(parseUnits('98.914582838240080159', 18)),
            );
            expect(await testNFT.balanceOf(bidder1.address)).to.equal(1);
            expect(await testNFT.balanceOf(auction.address)).to.equal(0);
        });

        it('simple auction - no bidder, auction ends', async () => {
            //await auction.withdraw();
            const tx = await auction.start();
            await tx.wait();
            expect(await testNFT.balanceOf(auction.address)).to.equal(1);
            expect(await testNFT.balanceOf(seller.address)).to.equal(0);

            await network.provider.send('evm_increaseTime', [300]); //advance timestamp in seconds
            await network.provider.send('evm_mine');
            expect(await auction.getCurrentPrice()).to.equal(parseUnits('10.0', 18));
            await network.provider.send('evm_increaseTime', [1]); //advance timestamp in seconds
            await network.provider.send('evm_mine');
            expect(await auction.getCurrentPrice()).to.equal(parseUnits('10.0', 18));
            await auction.claim();

            expect(await testNFT.balanceOf(seller.address)).to.equal(1);
            expect(await testNFT.balanceOf(auction.address)).to.equal(0);
        });

        it('error: bid after auction ends', async () => {
            await auction.start();
            await network.provider.send('evm_increaseTime', [300]); //advance timestamp in seconds
            await network.provider.send('evm_mine');
            expect(await auction.getCurrentPrice()).to.equal(parseUnits('10.0', 18));
            await expect(auction.connect(bidder1).bid()).to.be.revertedWith('DutchAuction: ended');
        });

        it('visual price change', async () => {
            const tx = await auction.start();
            await tx.wait();

            expect(await testNFT.balanceOf(auction.address)).to.equal(1);
            expect(await testNFT.balanceOf(seller.address)).to.equal(0);

            expect(await auction.getCurrentPrice()).to.equal(parseUnits('100.0', 18));

            //console.log('hi');
            for (let i = 0; i < 300; i++) {
                await network.provider.send('evm_increaseTime', [1]); //advance timestamp in seconds
                await network.provider.send('evm_mine');
                console.log(ethers.utils.formatEther(await auction.getCurrentPrice()));

                //expect(await auction.getCurrentPrice()).to.equal(parseUnits('10.0', 18));
            }
        });
    });
});
