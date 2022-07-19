import { ethers, network } from 'hardhat';
const { utils } = ethers;
const { parseUnits } = utils;
import { expect } from 'chai';
import {
    FixedPriceAuction,
    FixedPriceAuction__factory,
    ERC20,
    ERC1167Factory,
    ERC1167Factory__factory,
    ERC721,
} from '../../../typechain';

import { createERC20, createERC721, deployClone, predictDeployClone } from '../utils';
import { BigNumber } from 'ethers';
import { loadForwarder, loadSignersSmart, TestingSigner } from '@owlprotocol/contract-helpers-opengsn/src';

enum TokenType {
    erc721,
    erc1155,
}

describe('FixedPriceAuction.sol', function () {
    //Extra time
    this.timeout(100_000);
    let seller: TestingSigner;
    let buyer: TestingSigner;
    let owner: TestingSigner;

    let FixedPriceAuctionFactory: FixedPriceAuction__factory;
    let FixedPriceAuctionImplementation: FixedPriceAuction;

    let ERC1167FactoryFactory: ERC1167Factory__factory;
    let ERC1167Factory: ERC1167Factory;

    let gsnForwarderAddress = '0x0000000000000000000000000000000000000001';

    before(async () => {
        //Setup Test Environment
        gsnForwarderAddress = await loadForwarder(ethers);

        //launch Auction + implementation
        FixedPriceAuctionFactory = (await ethers.getContractFactory('FixedPriceAuction')) as FixedPriceAuction__factory;
        FixedPriceAuctionImplementation = await FixedPriceAuctionFactory.deploy();

        // Launch ERC1167 Factory
        ERC1167FactoryFactory = (await ethers.getContractFactory('ERC1167Factory')) as ERC1167Factory__factory;
        ERC1167Factory = await ERC1167FactoryFactory.deploy();

        await Promise.all([ERC1167Factory.deployed(), FixedPriceAuctionImplementation.deployed()]);

        //get users (seller + bidder?)
        [seller, buyer, owner] = await loadSignersSmart(ethers);
    });

    describe('No fee tests', () => {
        //define setup
        let testNFT: ERC721;
        let acceptableERC20Token: ERC20;
        let FixedPriceAuctionAddress: string;
        let auction: FixedPriceAuction;

        let originalERC20Balance: BigNumber;

        beforeEach(async () => {
            //Deploy ERC20 and ERC721
            [acceptableERC20Token] = await createERC20(); //mints 1e9 tokens
            [testNFT] = await createERC721(1, 1); //minting one token
            const tokenId = 0;

            //predict address
            FixedPriceAuctionAddress = await predictDeployClone(
                FixedPriceAuctionImplementation,
                [
                    //seller address
                    //Asset
                    //ERC20 Contract address (acceptable token)
                    //price
                    //auction duration
                    //sale fee
                    //sale fee address
                    seller.address,
                    {
                        token: TokenType.erc721,
                        contractAddr: testNFT.address,
                        tokenId,
                    },
                    acceptableERC20Token.address,
                    parseUnits('100.0', 18), //in "wei"
                    300,
                    0,
                    owner.address,
                    gsnForwarderAddress,
                ],
                ERC1167Factory,
            );

            //Set Approval ERC721 for sale
            await testNFT.connect(seller).approve(FixedPriceAuctionAddress, tokenId);
            await acceptableERC20Token.connect(buyer).approve(FixedPriceAuctionAddress, parseUnits('100.0', 18));

            // Transfer ERC20s to bidders
            await acceptableERC20Token.connect(seller).transfer(buyer.address, parseUnits('100.0', 18));

            const totalERC20Minted: BigNumber = parseUnits('1.0', 27);
            expect(await acceptableERC20Token.balanceOf(seller.address)).to.equal(
                totalERC20Minted.sub(parseUnits('100.0', 18)),
            );

            //deploy auction

            await deployClone(
                FixedPriceAuctionImplementation,
                [
                    //seller address
                    //Asset
                    //ERC20 Contract address (acceptable token)
                    //price
                    //auction duration
                    //sale fee
                    //sale fee address
                    seller.address,
                    {
                        token: TokenType.erc721,
                        contractAddr: testNFT.address,
                        tokenId,
                    },
                    acceptableERC20Token.address,
                    parseUnits('100.0', 18), //in "wei"
                    300,
                    0,
                    owner.address,
                    gsnForwarderAddress,
                ],
                ERC1167Factory,
            );
            auction = (await ethers.getContractAt('FixedPriceAuction', FixedPriceAuctionAddress)) as FixedPriceAuction;

            //assert initial token amounts

            originalERC20Balance = parseUnits('100.0', 18);

            expect(await testNFT.balanceOf(seller.address)).to.equal(0);
            expect(await testNFT.balanceOf(FixedPriceAuctionAddress)).to.equal(1);
            expect(await acceptableERC20Token.balanceOf(buyer.address)).to.equal(originalERC20Balance);
        });

        it('simple auction - 1 bidder', async () => {
            expect(await testNFT.balanceOf(auction.address)).to.equal(1);
            expect(await testNFT.balanceOf(seller.address)).to.equal(0);

            const sellerBalance = await acceptableERC20Token.balanceOf(seller.address);
            await auction.connect(buyer).buy();

            expect(await acceptableERC20Token.balanceOf(buyer.address)).to.equal(0);
            expect(await acceptableERC20Token.balanceOf(seller.address)).to.equal(
                sellerBalance.add(parseUnits('100.0', 18)),
            );
            expect(await testNFT.balanceOf(buyer.address)).to.equal(1);
            expect(await testNFT.balanceOf(auction.address)).to.equal(0);
        });

        it('simple auction - no bidder, auction ends', async () => {
            //await auction.withdraw();

            expect(await testNFT.balanceOf(auction.address)).to.equal(1);
            expect(await testNFT.balanceOf(seller.address)).to.equal(0);

            await network.provider.send('evm_increaseTime', [300]); //advance timestamp in seconds
            await network.provider.send('evm_mine');
            await auction.claim();

            expect(await testNFT.balanceOf(seller.address)).to.equal(1);
            expect(await testNFT.balanceOf(auction.address)).to.equal(0);
        });

        it('error: bid after auction ends', async () => {
            await network.provider.send('evm_increaseTime', [300]); //advance timestamp in seconds
            await network.provider.send('evm_mine');

            await expect(auction.connect(buyer).buy()).to.be.revertedWith('FixedPriceAuction: ended');
        });
    });

    describe('Fee Tests', () => {
        //define setup
        let testNFT: ERC721;
        let acceptableERC20Token: ERC20;
        let FixedPriceAuctionAddress: string;
        let auction: FixedPriceAuction;

        let originalERC20Balance: BigNumber;

        beforeEach(async () => {
            //Deploy ERC20 and ERC721
            [acceptableERC20Token] = await createERC20(); //mints 1e9 tokens
            [testNFT] = await createERC721(1, 1); //minting one token
            const tokenId = 0;

            FixedPriceAuctionAddress = await predictDeployClone(
                FixedPriceAuctionImplementation,
                [
                    //seller address
                    //Asset
                    //ERC20 Contract address (acceptable token)
                    //price
                    //auction duration
                    //sale fee
                    //sale fee address
                    seller.address,
                    {
                        token: TokenType.erc721,
                        contractAddr: testNFT.address,
                        tokenId,
                    },
                    acceptableERC20Token.address,
                    parseUnits('100.0', 18), //in "wei"
                    300,
                    10,
                    owner.address,
                    gsnForwarderAddress,
                ],
                ERC1167Factory,
            );

            //Set Approval ERC721 for sale
            await testNFT.connect(seller).approve(FixedPriceAuctionAddress, tokenId);
            await acceptableERC20Token.connect(buyer).approve(FixedPriceAuctionAddress, parseUnits('100.0', 18));

            // Transfer ERC20s to bidders
            await acceptableERC20Token.connect(seller).transfer(buyer.address, parseUnits('100.0', 18));

            const totalERC20Minted: BigNumber = parseUnits('1.0', 27);
            expect(await acceptableERC20Token.balanceOf(seller.address)).to.equal(
                totalERC20Minted.sub(parseUnits('100.0', 18)),
            );

            //deploy auction
            await deployClone(
                FixedPriceAuctionImplementation,
                [
                    //seller address
                    //Asset
                    //ERC20 Contract address (acceptable token)
                    //price
                    //auction duration
                    //sale fee
                    //sale fee address
                    seller.address,
                    {
                        token: TokenType.erc721,
                        contractAddr: testNFT.address,
                        tokenId,
                    },
                    acceptableERC20Token.address,
                    parseUnits('100.0', 18), //in "wei"
                    300,
                    10,
                    owner.address,
                    gsnForwarderAddress,
                ],
                ERC1167Factory,
            );
            auction = (await ethers.getContractAt('FixedPriceAuction', FixedPriceAuctionAddress)) as FixedPriceAuction;

            //assert initial token amounts
            originalERC20Balance = parseUnits('100.0', 18);
            expect(await testNFT.balanceOf(seller.address)).to.equal(0);
            expect(await testNFT.balanceOf(FixedPriceAuctionAddress)).to.equal(1);
            expect(await acceptableERC20Token.balanceOf(buyer.address)).to.equal(originalERC20Balance);
        });

        it('simple auction - 1 bidder', async () => {
            expect(await testNFT.balanceOf(auction.address)).to.equal(1);
            expect(await testNFT.balanceOf(seller.address)).to.equal(0);

            const sellerBalance = await acceptableERC20Token.balanceOf(seller.address);
            await auction.connect(buyer).buy();

            expect(await acceptableERC20Token.balanceOf(buyer.address)).to.equal(0);
            expect(await acceptableERC20Token.balanceOf(seller.address)).to.equal(
                sellerBalance.add(parseUnits('90.0', 18)),
            );
            expect(await acceptableERC20Token.balanceOf(owner.address)).to.equal(parseUnits('10.0', 18));
            expect(await testNFT.balanceOf(buyer.address)).to.equal(1);
            expect(await testNFT.balanceOf(auction.address)).to.equal(0);
        });
    });
});
