import { ethers, network } from 'hardhat';
const { utils } = ethers;
const { parseUnits } = utils;
import { expect, assert } from 'chai';
// import { SignerWithAddress } from '@nomiclabs/hardhat-ethers/signers';
import {
    DutchAuction,
    DutchAuction__factory,
    ERC1167Factory,
    ERC1167Factory__factory,
    ERC721Owl,
    ERC721Owl__factory,
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

import { createERC20, createERC721, createERC1155, deployCloneWrap, predictDeployClone, deployClone } from '../utils';
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
    let marketplace: TestingSigner;

    let ERC1167FactoryFactory: ERC1167Factory__factory;
    let ERC1167Factory: ERC1167Factory;

    let DutchAuctionFactory: DutchAuction__factory;
    let DutchAuctionImplementation: DutchAuction;

    let gsnForwarderAddress = '0x0000000000000000000000000000000000000001';

    before(async () => {
        //Setup Test Environment
        ({ gsnForwarderAddress } = await loadEnvironment(ethers, network));
        [seller, bidder1, owner, marketplace] = await loadSignersSmart(ethers, network);

        //launch Auction + implementation
        DutchAuctionFactory = (await ethers.getContractFactory('DutchAuction')) as DutchAuction__factory;
        DutchAuctionImplementation = await DutchAuctionFactory.deploy();

        // Launch ERC1167 Factory
        ERC1167FactoryFactory = (await ethers.getContractFactory('ERC1167Factory')) as ERC1167Factory__factory;
        ERC1167Factory = await ERC1167FactoryFactory.deploy();

        await Promise.all([DutchAuctionImplementation.deployed()]);
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
                    //forwarder 
                    seller.address,
                    {
                        token: 5,
                        contractAddr: testNFT.address,
                        tokenId,
                    },
                    acceptableERC20Token.address,
                    100, //in "wei"
                    10,
                    300,
                    true,
                    0,
                    owner.address,
                    gsnForwarderAddress,
                ],
                ERC1167Factory,
            )).to.be.revertedWith('');
        });

        it('seller and saleFeeAddress same', async () => {
            await expect(deployClone(
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
                    //forwarder 
                    seller.address,
                    {
                        token: TokenType.erc721,
                        contractAddr: testNFT.address,
                        tokenId,
                    },
                    acceptableERC20Token.address,
                    100, //in "wei"
                    10,
                    300,
                    true,
                    0,
                    seller.address,
                    gsnForwarderAddress,
                ],
                ERC1167Factory,
            )).to.be.revertedWith('DutchAuction: seller cannot be the same as the owner!');
        });

        it('sale fee over 100', async () => {
            await expect(deployClone(
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
                    //forwarder 
                    seller.address,
                    {
                        token: TokenType.erc721,
                        contractAddr: testNFT.address,
                        tokenId,
                    },
                    acceptableERC20Token.address,
                    100, //in "wei"
                    10,
                    300,
                    true,
                    999,
                    owner.address,
                    gsnForwarderAddress,
                ],
                ERC1167Factory,
            )).to.be.revertedWith('DutchAuction: sale fee cannot be greater than 100 percent!');
        });

        it('end price greater or equal to start price', async () => {
            await expect(deployClone(
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
                    //forwarder 
                    seller.address,
                    {
                        token: TokenType.erc721,
                        contractAddr: testNFT.address,
                        tokenId,
                    },
                    acceptableERC20Token.address,
                    100, //in "wei"
                    999,
                    300,
                    true,
                    0,
                    owner.address,
                    gsnForwarderAddress,
                ],
                ERC1167Factory,
            )).to.be.revertedWith('DutchAuction: start price must be greater than end price');
        });
    });

    describe('Royalty fee test ERC721Owl', () => {
        //define setup
        let testNFTFactory: ERC721Owl__factory
        let testNFTImpl: ERC721Owl;
        let test1155Inst: ERC721Owl;
        const tokenId = 0;
        let acceptableERC20Token: FactoryERC20;
        let DutchAuctionAddress: string;

        const totalERC20Minted = parseUnits('1.0', 27);

        let auction: DutchAuction;

        beforeEach(async () => {
            //Deploy ERC20 and ERC721
            [acceptableERC20Token] = await createERC20(); //mints 1e9 tokens

            // Deploy test Owl 
            testNFTFactory = (await ethers.getContractFactory('ERC721Owl')) as ERC721Owl__factory;
            testNFTImpl = await testNFTFactory.deploy();
            const { address } = await deployClone(testNFTImpl,
                [owner.address, 'n', 's', 'u', gsnForwarderAddress, owner.address, 3000], ERC1167Factory);
            test1155Inst = await (ethers.getContractAt('ERC721Owl', address)) as ERC721Owl;
            await test1155Inst.connect(owner).mint(seller.address, 0);


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
                    //forwarder 
                    seller.address,
                    {
                        token: TokenType.erc721,
                        contractAddr: test1155Inst.address,
                        tokenId,
                    },
                    acceptableERC20Token.address,
                    100, //in "wei"
                    10,
                    300,
                    false,
                    20,
                    marketplace.address,
                    gsnForwarderAddress,
                ],
                ERC1167Factory,
            );

            //Set Approval ERC721 for sale
            await test1155Inst.connect(seller).approve(DutchAuctionAddress, tokenId);

            await acceptableERC20Token.connect(bidder1).approve(DutchAuctionAddress, parseUnits('1.0', 27));

            // Transfer ERC20s to bidders
            await acceptableERC20Token.connect(seller).transfer(bidder1.address, parseUnits('1.0', 27));

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
                        //forwarder 
                        seller.address,
                        {
                            token: TokenType.erc721,
                            contractAddr: test1155Inst.address,
                            tokenId,
                        },
                        acceptableERC20Token.address,
                        100, //in "wei"
                        10,
                        300,
                        false,
                        20,
                        marketplace.address,
                        gsnForwarderAddress,
                    ],
                    ERC1167Factory,
                    undefined,
                    undefined,
                    seller,
                )
            ).contract as DutchAuction;

            //assert initial token amounts
            expect(await acceptableERC20Token.balanceOf(seller.address)).to.equal(0);

            expect(await test1155Inst.balanceOf(seller.address)).to.equal(0);
            expect(await test1155Inst.balanceOf(DutchAuctionAddress)).to.equal(1);
            expect(await acceptableERC20Token.balanceOf(bidder1.address)).to.equal(totalERC20Minted);
        });

        it('Test bid', async () => {
            await (await auction.connect(bidder1).bid()).wait();
            const price = await auction.getCurrentPrice();
            expect(await acceptableERC20Token.balanceOf(bidder1.address)).to.equal(totalERC20Minted.sub(price));
            expect(await test1155Inst.balanceOf(bidder1.address)).to.equal(1);
            expect(await acceptableERC20Token.balanceOf(owner.address)).to.equal(price.mul(3).div(10));
            expect(await acceptableERC20Token.balanceOf(marketplace.address)).to.equal(price.mul(2).div(10));
            expect(await acceptableERC20Token.balanceOf(seller.address)).to.equal(price.mul(5).div(10));
        });
    });

    describe('Royalty fee test ERC1155Owl', () => {
        //define setup
        let test1155Factory: ERC1155Owl__factory;
        let test1155Impl: ERC1155Owl;
        let test1155Inst: ERC1155Owl;
        const tokenId = 0;
        let acceptableERC20Token: FactoryERC20;
        let DutchAuctionAddress: string;

        const totalERC20Minted = parseUnits('1.0', 27);

        let auction: DutchAuction;

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
                    //forwarder 
                    seller.address,
                    {
                        token: TokenType.erc1155,
                        contractAddr: test1155Inst.address,
                        tokenId,
                    },
                    acceptableERC20Token.address,
                    100, //in "wei"
                    10,
                    300,
                    false,
                    20,
                    marketplace.address,
                    gsnForwarderAddress,
                ],
                ERC1167Factory,
            );

            //Set Approval ERC721 for sale
            await test1155Inst.connect(seller).setApprovalForAll(DutchAuctionAddress, true);

            await acceptableERC20Token.connect(bidder1).approve(DutchAuctionAddress, parseUnits('1.0', 27));

            // Transfer ERC20s to bidders
            await acceptableERC20Token.connect(seller).transfer(bidder1.address, parseUnits('1.0', 27));

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
                        //forwarder 
                        seller.address,
                        {
                            token: TokenType.erc1155,
                            contractAddr: test1155Inst.address,
                            tokenId,
                        },
                        acceptableERC20Token.address,
                        100, //in "wei"
                        10,
                        300,
                        false,
                        20,
                        marketplace.address,
                        gsnForwarderAddress,
                    ],
                    ERC1167Factory,
                    undefined,
                    undefined,
                    seller,
                )
            ).contract as DutchAuction;

            //assert initial token amounts
            expect(await acceptableERC20Token.balanceOf(seller.address)).to.equal(0);
            expect(await test1155Inst.balanceOf(seller.address, tokenId)).to.equal(0);
            expect(await test1155Inst.balanceOf(DutchAuctionAddress, tokenId)).to.equal(1);
            expect(await acceptableERC20Token.balanceOf(bidder1.address)).to.equal(totalERC20Minted);
        });

        it('Test bid', async () => {
            await (await auction.connect(bidder1).bid()).wait();
            const price = await auction.getCurrentPrice();
            expect(await acceptableERC20Token.balanceOf(bidder1.address)).to.equal(totalERC20Minted.sub(price));
            expect(await test1155Inst.balanceOf(bidder1.address, tokenId)).to.equal(1);
            expect(await acceptableERC20Token.balanceOf(owner.address)).to.equal(price.mul(3).div(10));
            expect(await acceptableERC20Token.balanceOf(marketplace.address)).to.equal(price.mul(2).div(10));
            expect(await acceptableERC20Token.balanceOf(seller.address)).to.equal(price.mul(5).div(10));
        });
    });

    describeNoGSN('Linear Auction Tests - No GSN', () => {
        //define setup
        let testNFT: FactoryERC721;
        const tokenId = 0;
        let acceptableERC20Token: FactoryERC20;
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
                    //forwarder 
                    seller.address,
                    {
                        token: TokenType.erc721,
                        contractAddr: testNFT.address,
                        tokenId,
                    },
                    acceptableERC20Token.address,
                    100, //in "wei"
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
                        //forwarder 
                        seller.address,
                        {
                            token: TokenType.erc721,
                            contractAddr: testNFT.address,
                            tokenId,
                        },
                        acceptableERC20Token.address,
                        100, //in "wei"
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
            await network.provider.send('evm_increaseTime', [23]); //advance timestamp in seconds
            await network.provider.send('evm_mine');
            expect(await auction.getCurrentPrice()).to.equal(parseUnits('93.100000000000000060', 18)); // known to fail/deviate occassionally
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

            const finalBalance = await ethers.provider.getBalance(bidder1.address);
            assert.isTrue(finalBalance.lt(initialBalance), 'finalBalance !< initialBalance');
        });

        it('simple auction - 1 bidder - GSN', async () => {
            const initialBalance = await ethers.provider.getBalance(bidder1.address);
            expect(await testNFT.balanceOf(auction.address)).to.equal(1);
            expect(await testNFT.balanceOf(seller.address)).to.equal(0);

            expect(await auction.getCurrentPrice()).to.equal(parseUnits('100.0', 18));
            await network.provider.send('evm_increaseTime', [23]); //advance timestamp in seconds
            await network.provider.send('evm_mine');
            expect(await auction.getCurrentPrice()).to.equal(parseUnits('93.100000000000000060', 18)); // known to fail/deviate occassionally
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

            const finalBalance = await ethers.provider.getBalance(bidder1.address);
            assert.isTrue(finalBalance.lt(initialBalance), 'finalBalance !< initialBalance');
        });

        it('simple auction - no bidder, auction ends', async () => {
            //await auction.withdraw();

            expect(await testNFT.balanceOf(auction.address)).to.equal(1);
            expect(await testNFT.balanceOf(seller.address)).to.equal(0);

            await network.provider.send('evm_increaseTime', [300]); //advance timestamp in seconds
            await network.provider.send('evm_mine');
            expect(await auction.getCurrentPrice()).to.equal(parseUnits('10.0', 18));
            await auction.claim();

            expect(await testNFT.balanceOf(seller.address)).to.equal(1);
            expect(await testNFT.balanceOf(auction.address)).to.equal(0);
        });

        it('error: bid after already bought', async () => {
            await auction.connect(bidder1).bid();
            await expect(auction.connect(bidder1).bid()).to.be.revertedWith('DutchAuction: somebody has already bought this item!');
        });

        it('error: bid after auction ends', async () => {
            await network.provider.send('evm_increaseTime', [300]); //advance timestamp in seconds
            await network.provider.send('evm_mine');
            expect(await auction.getCurrentPrice()).to.equal(parseUnits('10.0', 18));
            await expect(auction.connect(bidder1).bid()).to.be.revertedWith('DutchAuction: ended');
        });

        it('error: claim during auction', async () => {
            await expect(auction.claim()).to.be.revertedWith('DutchAuction: cannot claim when auction is ongoing!');
        });

        it('error: claim after already bought', async () => {
            await auction.connect(bidder1).bid();
            await network.provider.send('evm_increaseTime', [300]); //advance timestamp in seconds
            await network.provider.send('evm_mine');
            await expect(auction.claim()).to.be.revertedWith('DutchAuction: you cannot claim when the the asset was already sold!');
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

            const { address: beaconAddr } = await deployClone(beaconImpl, [seller.address, DutchAuctionImplementation.address], ERC1167Factory);
            //@ts-ignore
            const data = DutchAuctionImplementation.interface.encodeFunctionData('proxyInitialize',
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
                    //forwarder 
                    seller.address,
                    {
                        token: TokenType.erc721,
                        contractAddr: testNFT2.address,
                        tokenId,
                    },
                    acceptableERC20Token.address,
                    100, //in "wei"
                    10,
                    300,
                    false,
                    0,
                    owner.address,
                    gsnForwarderAddress,
                ])
            const beaconProxyAddr = await predictDeployClone(beaconProxyImpl, [seller.address, beaconAddr, data], ERC1167Factory);
            //Set Approval ERC721 for sale

            await testNFT2.connect(seller).approve(beaconProxyAddr, tokenId);
            await deployClone(beaconProxyImpl, [seller.address, beaconAddr, data], ERC1167Factory);
            const contrInst = (await ethers.getContractAt('DutchAuction', beaconProxyAddr)) as DutchAuction;

            //transformer doesn't have only dna role
            contrInst.connect(bidder1).bid();
        });
    });

    describe('Nonlinear Auction Tests', () => {
        //define setup
        let testNFT: FactoryERC721;
        const tokenId = 0;
        let acceptableERC20Token: FactoryERC20;
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
                    //forwarder 
                    seller.address,
                    {
                        token: TokenType.erc721,
                        contractAddr: testNFT.address,
                        tokenId,
                    },
                    acceptableERC20Token.address,
                    100, //in "wei"
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
                    //forwarder 
                    seller.address,
                    {
                        token: TokenType.erc721,
                        contractAddr: testNFT.address,
                        tokenId,
                    },
                    acceptableERC20Token.address,
                    100, //in "wei"
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

            await network.provider.send('evm_increaseTime', [23]); //advance timestamp in seconds
            await network.provider.send('evm_mine');
            expect(await auction.getCurrentPrice()).to.equal(parseUnits('99.583401815135389380', 18)); // known to fail/deviate occassionally
            await network.provider.send('evm_increaseTime', [25]); //advance timestamp in seconds
            await network.provider.send('evm_mine');

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
            await network.provider.send('evm_increaseTime', [300]); //advance timestamp in seconds
            await network.provider.send('evm_mine');
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
            let test1155: FactoryERC1155;
            let acceptableERC20Token: FactoryERC20;
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
                        //forwarder 
                        seller.address,
                        {
                            token: TokenType.erc1155,
                            contractAddr: test1155.address,
                            tokenId: 1,
                        },
                        acceptableERC20Token.address,
                        100, //in "wei"
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
                        //forwarder 
                        seller.address,
                        {
                            token: TokenType.erc1155,
                            contractAddr: test1155.address,
                            tokenId: 1,
                        },
                        acceptableERC20Token.address,
                        100, //in "wei"
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
                expect(await test1155.balanceOf(bidder1.address, 1)).to.equal(1);
                expect(await test1155.balanceOf(auction.address, 1)).to.equal(0);
            });

            it('simple auction - no bidder, auction ends', async () => {
                expect(await test1155.balanceOf(auction.address, 1)).to.equal(1);
                expect(await test1155.balanceOf(seller.address, 1)).to.equal(99);

                await network.provider.send('evm_increaseTime', [300]); //advance timestamp in seconds
                await network.provider.send('evm_mine');
                expect(await auction.getCurrentPrice()).to.equal(parseUnits('10.0', 18));
                await auction.claim();

                expect(await test1155.balanceOf(seller.address, 1)).to.equal(100);
                expect(await test1155.balanceOf(auction.address, 1)).to.equal(0);
            });

            it('error: bid after auction ends', async () => {
                await network.provider.send('evm_increaseTime', [300]); //advance timestamp in seconds
                await network.provider.send('evm_mine');
                expect(await auction.getCurrentPrice()).to.equal(parseUnits('10.0', 18));
                await expect(auction.connect(bidder1).bid()).to.be.revertedWith('DutchAuction: ended');
            });
        });
    });
});

describe.skip('TODO - IM BROKEN PLEASE FIX ME -------- HELLLLPPPPPPPPP - DutchAuction.sol 10% Fees', function () {
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
        let testNFT: FactoryERC721;
        const tokenId = 0;
        let acceptableERC20Token: FactoryERC20;
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
                    //forwarder 
                    seller.address,
                    {
                        token: TokenType.erc721,
                        contractAddr: testNFT.address,
                        tokenId,
                    },
                    acceptableERC20Token.address,
                    100, //in "wei"
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
                        //forwarder 
                        seller.address,
                        {
                            token: TokenType.erc721,
                            contractAddr: testNFT.address,
                            tokenId,
                        },
                        acceptableERC20Token.address,
                        100, //in "wei"
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
            expect(await testNFT.balanceOf(seller.address)).to.equal(0);
            expect(await testNFT.balanceOf(DutchAuctionAddress)).to.equal(1);
            expect(await acceptableERC20Token.balanceOf(bidder1.address)).to.equal(originalERC20Balance);
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
                    90, //in "wei"
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
                    90, //in "wei"
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
            console.log(timestampBefore);

            const blockNumBefore2 = await ethers.provider.getBlockNumber();
            const blockBefore2 = await ethers.provider.getBlock(blockNumBefore2);
            const timestampBefore2 = blockBefore2.timestamp;
            console.log(timestampBefore2);
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
