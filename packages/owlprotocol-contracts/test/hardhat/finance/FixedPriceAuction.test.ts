import { ethers, network } from 'hardhat';
const { utils } = ethers;
const { parseUnits } = utils;
import { expect } from 'chai';
import {
    FixedPriceAuction,
    FixedPriceAuction__factory,
    ERC1167Factory,
    ERC1167Factory__factory,
    FactoryERC1155,
    FactoryERC20,
    FactoryERC721,
} from '../../../typechain';

import { createERC1155, createERC20, createERC721, deployClone, predictDeployClone } from '../utils';
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

    describe('Initialization reverts', () => {
        //define setup
        let testNFT: FactoryERC721;
        let acceptableERC20Token: FactoryERC20;
        let tokenId: number;

        beforeEach(async () => {
            //Deploy ERC20 and ERC721
            [acceptableERC20Token] = await createERC20(); //mints 1e9 tokens
            [testNFT] = await createERC721(1, 1); //minting one token
            tokenId = 0;
        });
        it('Invalid token type', async () => {
            await expect(deployClone(
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
                        token: 3,
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
            )).to.be.revertedWith('');
        });

        it('seller and saleFeeAddress same', async () => {
            await expect(deployClone(
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
                    seller.address,
                    gsnForwarderAddress,
                ],
                ERC1167Factory,
            )).to.be.revertedWith('FixedPriceAuction: seller cannot be the same as the owner!');
        });

        it('sale fee over 100', async () => {
            await expect(deployClone(
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
                    200,
                    owner.address,
                    gsnForwarderAddress,
                ],
                ERC1167Factory,
            )).to.be.revertedWith('FixedPriceAuction: sale fee cannot be greater than 100 percent!');
        });
    })

    describe('No fee test - ERC721', () => {
        //define setup
        let testNFT: FactoryERC721;
        let acceptableERC20Token: FactoryERC20;
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

        it('error: claim before auction ends', async () => {
            await expect(auction.claim()).to.be.revertedWith('FixedPriceAuction: cannot claim when auction is ongoing!');
        });

        it('error: claim when already bought', async () => {
            await auction.connect(buyer).buy();
            await expect(auction.claim()).to.be.revertedWith('FixedPriceAuction: cannot claim when the token has been sold already!');
        })
    });

    describe('No fee test - ERC1155', () => {
        //define setup
        let testERC1155: FactoryERC1155;
        let acceptableERC20Token: FactoryERC20;
        let FixedPriceAuctionAddress: string;
        let auction: FixedPriceAuction;
        let tokenId: number;

        let originalERC20Balance: BigNumber;
        let originalERC1155Balance: BigNumber;

        beforeEach(async () => {
            //Deploy ERC20 and ERC721
            [acceptableERC20Token] = await createERC20();
            [testERC1155] = await createERC1155(1);
            tokenId = 0;

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
                        token: TokenType.erc1155,
                        contractAddr: testERC1155.address,
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
            await testERC1155.connect(seller).setApprovalForAll(FixedPriceAuctionAddress, true);
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
                        token: TokenType.erc1155,
                        contractAddr: testERC1155.address,
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
            originalERC1155Balance = parseUnits('100.0', 0);

            expect(await testERC1155.balanceOf(seller.address, tokenId)).to.equal(originalERC1155Balance.sub(1));
            expect(await testERC1155.balanceOf(FixedPriceAuctionAddress, tokenId)).to.equal(1);
            expect(await acceptableERC20Token.balanceOf(buyer.address)).to.equal(originalERC20Balance);
        });

        it('simple auction - 1 bidder', async () => {
            const sellerBalance = await acceptableERC20Token.balanceOf(seller.address);
            await auction.connect(buyer).buy();

            expect(await acceptableERC20Token.balanceOf(buyer.address)).to.equal(0);
            expect(await acceptableERC20Token.balanceOf(seller.address)).to.equal(
                sellerBalance.add(parseUnits('100.0', 18)),
            );
            expect(await testERC1155.balanceOf(buyer.address, tokenId)).to.equal(1);
            expect(await testERC1155.balanceOf(auction.address, tokenId)).to.equal(0);
        });

        it('simple auction - no bidder, auction ends', async () => {
            await network.provider.send('evm_increaseTime', [300]); //advance timestamp in seconds
            await network.provider.send('evm_mine');
            await auction.claim();

            expect(await testERC1155.balanceOf(seller.address, tokenId)).to.equal(originalERC1155Balance);
            expect(await testERC1155.balanceOf(auction.address, tokenId)).to.equal(0);
        });

        it('error: bid after auction ends', async () => {
            await network.provider.send('evm_increaseTime', [300]); //advance timestamp in seconds
            await network.provider.send('evm_mine');

            await expect(auction.connect(buyer).buy()).to.be.revertedWith('FixedPriceAuction: ended');
        });

        it('error: bid after already bought', async () => {
            await auction.connect(buyer).buy();
            await expect(auction.connect(buyer).buy()).to.be.revertedWith('FixedPriceAuction: somebody has already bought this item!');
        });
    });

    describe('Fee Tests', () => {
        //define setup
        let testNFT: FactoryERC721;
        let acceptableERC20Token: FactoryERC20;
        let FixedPriceAuctionAddress: string;
        let auction: FixedPriceAuction;
        let tokenId: number;

        let originalERC20Balance: BigNumber;

        beforeEach(async () => {
            //Deploy ERC20 and ERC721
            [acceptableERC20Token] = await createERC20(); //mints 1e9 tokens
            [testNFT] = await createERC721(1, 1); //minting one token
            tokenId = 0;

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
            expect(await testNFT.ownerOf(tokenId)).to.equal(FixedPriceAuctionAddress);
            expect(await acceptableERC20Token.balanceOf(buyer.address)).to.equal(originalERC20Balance);
        });

        it('simple auction - 1 bidder', async () => {
            expect(await testNFT.ownerOf(tokenId)).to.equal(auction.address);

            const sellerBalance = await acceptableERC20Token.balanceOf(seller.address);
            await auction.connect(buyer).buy();

            expect(await acceptableERC20Token.balanceOf(buyer.address)).to.equal(0);
            expect(await acceptableERC20Token.balanceOf(seller.address)).to.equal(
                sellerBalance.add(parseUnits('90.0', 18)),
            );
            expect(await acceptableERC20Token.balanceOf(owner.address)).to.equal(parseUnits('10.0', 18));
            expect(await testNFT.ownerOf(tokenId)).to.equal(buyer.address);
        });
    });
});
