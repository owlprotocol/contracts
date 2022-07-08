import { ethers, network } from 'hardhat';
const { utils } = ethers;
const { parseUnits } = utils;
import { expect } from 'chai';
import { SignerWithAddress } from '@nomiclabs/hardhat-ethers/signers';
//import _, { pick } from 'lodash';
import {
    Rent,
    Rent__factory,
    ERC20,
    ERC1167Factory,
    ERC1167Factory__factory,
    ERC721,
    ERC721OwlExpiring,
    ERC721OwlExpiring__factory,
} from '../../typechain';

import { createERC20, createERC721 } from '../utils';
import { BigNumber } from 'ethers';

describe('Rent.sol', function () {
    //Extra time
    this.timeout(10000);
    let admin: SignerWithAddress;
    let _owner: SignerWithAddress;
    let _renter: SignerWithAddress;
    let shadowAddress = '';

    let RentFactory: Rent__factory;
    let RentImplementation: Rent;

    let ERC721OwlExpiringFactory: ERC721OwlExpiring__factory;
    let ERC721OwlExpiringImplementation: ERC721OwlExpiring;

    let ERC1167FactoryFactory: ERC1167Factory__factory;
    let ERC1167Factory: ERC1167Factory;

    let rentable: ERC721OwlExpiring;

    before(async () => {
        let name = '';
        let symbol = '';
        let baseURI = '';

        //launch Auction + implementation
        RentFactory = (await ethers.getContractFactory('Rent')) as Rent__factory;
        RentImplementation = await RentFactory.deploy();

        // Launch ERC1167 Factory
        ERC1167FactoryFactory = (await ethers.getContractFactory('ERC1167Factory')) as ERC1167Factory__factory;
        ERC1167Factory = await ERC1167FactoryFactory.deploy();

        await Promise.all([ERC1167Factory.deployed(), RentImplementation.deployed()]);

        //get users
        [admin, _owner, _renter] = await ethers.getSigners();

        ERC721OwlExpiringFactory = (await ethers.getContractFactory('ERC721OwlExpiring')) as ERC721OwlExpiring__factory;
        ERC721OwlExpiringImplementation = await ERC721OwlExpiringFactory.deploy();

        const ERC721OwlExpiringData = ERC721OwlExpiringImplementation.interface.encodeFunctionData('initialize', [
            //admin
            //name
            //symbol
            //baseURI
            admin.address,
            name,
            symbol,
            baseURI,
        ]);

        //Predict address
        const salt = ethers.utils.formatBytes32String('1');
        shadowAddress = await ERC1167Factory.predictDeterministicAddress(
            ERC721OwlExpiringImplementation.address,
            salt,
            ERC721OwlExpiringData,
        );

        await ERC1167Factory.cloneDeterministic(ERC721OwlExpiringImplementation.address, salt, ERC721OwlExpiringData);
        rentable = (await ethers.getContractAt('ERC721OwlExpiring', shadowAddress)) as ERC721OwlExpiring;
    });

    describe('Rent Tests - ERC721', () => {
        //define setup
        let testNFT: ERC721;
        let acceptableERC20Token: ERC20;
        let RentAddress: string;
        let rent: Rent;

        let originalERC20Balance: number;

        beforeEach(async () => {
            //Deploy ERC20 and ERC721
            [acceptableERC20Token] = await createERC20(1); //mints 1,000,000,000 by default
            [testNFT] = await createERC721(1, 10); //minting one token

            //Rent Data
            const RentData = RentImplementation.interface.encodeFunctionData('initialize', [
                admin.address,
                acceptableERC20Token.address,
                testNFT.address,
                shadowAddress,
            ]);

            //Predict address
            const salt = ethers.utils.formatBytes32String('1');
            RentAddress = await ERC1167Factory.predictDeterministicAddress(RentImplementation.address, salt, RentData);

            //Set Approval ERC721 for sale
            await testNFT.connect(admin).setApprovalForAll(RentAddress, true);
            await acceptableERC20Token.connect(_renter).approve(RentAddress, 100);

            // Transfer ERC20s to bidders
            await testNFT.connect(admin).transferFrom(admin.address, _owner.address, 1);
            await testNFT.connect(admin).transferFrom(admin.address, _owner.address, 2);
            await testNFT.connect(admin).setApprovalForAll(_owner.address, true);
            await testNFT.connect(_owner).setApprovalForAll(RentAddress, true);

            await acceptableERC20Token.connect(admin).transfer(_renter.address, 100);
            const totalERC20Minted: BigNumber = parseUnits('1000000000.0');
            expect(await acceptableERC20Token.balanceOf(admin.address)).to.equal(totalERC20Minted.sub(100));

            //deploy rent
            //check balances
            ///clone deterministic
            await ERC1167Factory.cloneDeterministic(RentImplementation.address, salt, RentData);
            rent = (await ethers.getContractAt('Rent', RentAddress)) as Rent;

            //assert initial token amounts

            originalERC20Balance = 100;

            expect(await testNFT.ownerOf(1)).to.equal(_owner.address);
            expect(await testNFT.ownerOf(2)).to.equal(_owner.address);
            expect(await testNFT.balanceOf(_owner.address)).to.equal(2);
            expect(await testNFT.balanceOf(admin.address)).to.equal(8);

            expect(await acceptableERC20Token.balanceOf(_renter.address)).to.equal(originalERC20Balance);

            rentable.connect(admin).grantMinter(RentAddress);
            rentable.connect(admin).grantExpiry(RentAddress);
            rentable.connect(admin).grantExpiry(_renter.address);
        });

        it('simple rent - 1 rent instance', async () => {
            await rent.createRental({
                nftId: 1,
                owner: _owner.address,
                renter: _renter.address,
                ended: false,
                timePeriods: 3,
                pricePerPeriod: 10,
                expireTimePerPeriod: 86400,
            });
            expect(await testNFT.balanceOf(RentAddress)).to.equal(1);
            expect(await testNFT.ownerOf(1)).to.equal(RentAddress);
            expect(await rent.getNumRentals()).to.equal(1);

            await rent.connect(_renter).startRent(0);
            expect(await acceptableERC20Token.balanceOf(_renter.address)).to.equal(90);
            expect(await acceptableERC20Token.balanceOf(RentAddress)).to.equal(10);

            await rent.connect(_renter).payRent(0, 1);
            expect(await acceptableERC20Token.balanceOf(_renter.address)).to.equal(80);
            expect(await acceptableERC20Token.balanceOf(RentAddress)).to.equal(20);

            await rent.connect(_renter).payRent(0, 1);
            expect(await acceptableERC20Token.balanceOf(_renter.address)).to.equal(70);
            expect(await acceptableERC20Token.balanceOf(RentAddress)).to.equal(30);

            await network.provider.send('evm_increaseTime', [86400]);

            await rent.connect(_owner).endRental(0);
            expect(await testNFT.ownerOf(1)).to.equal(_owner.address);
            expect(await testNFT.balanceOf(_owner.address)).to.equal(2);

            await rent.connect(_owner).ownerClaim();
            expect(await acceptableERC20Token.balanceOf(_owner.address)).to.equal(30);

            await expect(rentable.ownerOf(1)).to.revertedWith('ERC721: owner query for nonexistent token');
        });

        it('multiple rent', async () => {
            await rent.createRental({
                nftId: 1,
                owner: _owner.address,
                renter: _renter.address,
                ended: false,
                timePeriods: 3,
                pricePerPeriod: 10,
                expireTimePerPeriod: 86400,
            });

            await rent.createRental({
                nftId: 2,
                owner: _owner.address,
                renter: _renter.address,
                ended: false,
                timePeriods: 2,
                pricePerPeriod: 5,
                expireTimePerPeriod: 86400,
            });

            expect(await testNFT.balanceOf(RentAddress)).to.equal(2);
            expect(await testNFT.ownerOf(1)).to.equal(RentAddress);
            expect(await testNFT.ownerOf(2)).to.equal(RentAddress);
            expect(await rent.getNumRentals()).to.equal(2);

            await rent.connect(_renter).startRent(0);
            expect(await acceptableERC20Token.balanceOf(_renter.address)).to.equal(90);
            expect(await acceptableERC20Token.balanceOf(RentAddress)).to.equal(10);

            await rent.connect(_renter).payRent(0, 1);
            expect(await acceptableERC20Token.balanceOf(_renter.address)).to.equal(80);
            expect(await acceptableERC20Token.balanceOf(RentAddress)).to.equal(20);

            await rent.connect(_renter).startRent(1);
            expect(await acceptableERC20Token.balanceOf(_renter.address)).to.equal(75);
            expect(await acceptableERC20Token.balanceOf(RentAddress)).to.equal(25);

            await rent.connect(_renter).payRent(1, 1);
            expect(await acceptableERC20Token.balanceOf(_renter.address)).to.equal(70);
            expect(await acceptableERC20Token.balanceOf(RentAddress)).to.equal(30);

            await rent.connect(_owner).endRental(1);
            expect(await testNFT.ownerOf(2)).to.equal(_owner.address);
            await rent.connect(_owner).ownerClaim();
            expect(await acceptableERC20Token.balanceOf(_owner.address)).to.equal(30);
            await expect(rentable.ownerOf(2)).to.revertedWith('ERC721: owner query for nonexistent token');

            await rent.connect(_renter).payRent(0, 1);
            expect(await acceptableERC20Token.balanceOf(_renter.address)).to.equal(60);
            expect(await acceptableERC20Token.balanceOf(RentAddress)).to.equal(10);

            await network.provider.send('evm_increaseTime', [86400]);

            await rent.connect(_owner).endRental(0);
            expect(await testNFT.ownerOf(1)).to.equal(_owner.address);
            expect(await testNFT.balanceOf(_owner.address)).to.equal(2);

            await rent.connect(_owner).ownerClaim();
            expect(await acceptableERC20Token.balanceOf(_owner.address)).to.equal(40);

            await expect(rentable.ownerOf(1)).to.revertedWith('ERC721: owner query for nonexistent token');
        });

        it('errors - start rental', async () => {
            await rent.createRental({
                nftId: 1,
                owner: _owner.address,
                renter: _renter.address,
                ended: false,
                timePeriods: 3,
                pricePerPeriod: 10,
                expireTimePerPeriod: 86400,
            });
            await expect(rent.connect(_owner).startRent(0)).to.be.revertedWith(
                'you are not the renter and cannot pay rent',
            );
        });

        it('errors - already started', async () => {
            await rent.createRental({
                nftId: 1,
                owner: _owner.address,
                renter: _renter.address,
                ended: false,
                timePeriods: 3,
                pricePerPeriod: 10,
                expireTimePerPeriod: 86400,
            });
            await rent.connect(_renter).startRent(0);
            expect(await rent.getTimePeriodsPaid(0)).to.equal(1);
            await expect(rent.connect(_renter).startRent(0)).to.be.revertedWith('rent has already been started');
        });

        it('errors - pay too much', async () => {
            await rent.createRental({
                nftId: 1,
                owner: _owner.address,
                renter: _renter.address,
                ended: false,
                timePeriods: 3,
                pricePerPeriod: 10,
                expireTimePerPeriod: 86400,
            });
            await rent.connect(_renter).startRent(0);
            await expect(rent.connect(_renter).payRent(0, 3)).to.be.revertedWith(
                'you are trying to pay for extra periods!',
            );
        });

        it('errors - pay after ending', async () => {
            await rent.createRental({
                nftId: 1,
                owner: _owner.address,
                renter: _renter.address,
                ended: false,
                timePeriods: 3,
                pricePerPeriod: 10,
                expireTimePerPeriod: 86400,
            });
            expect(await testNFT.balanceOf(RentAddress)).to.equal(1);
            expect(await testNFT.ownerOf(1)).to.equal(RentAddress);
            expect(await rent.getNumRentals()).to.equal(1);

            await rent.connect(_renter).startRent(0);
            expect(await acceptableERC20Token.balanceOf(_renter.address)).to.equal(90);
            expect(await acceptableERC20Token.balanceOf(RentAddress)).to.equal(10);

            await rent.connect(_owner).endRental(0);
            expect(await testNFT.ownerOf(1)).to.equal(_owner.address);
            expect(await testNFT.balanceOf(_owner.address)).to.equal(2);

            await expect(rent.connect(_renter).payRent(0, 1)).to.be.revertedWith('Rent has been terminated');
        });

        it('errors - renter trying to end', async () => {
            await rent.createRental({
                nftId: 1,
                owner: _owner.address,
                renter: _renter.address,
                ended: false,
                timePeriods: 3,
                pricePerPeriod: 10,
                expireTimePerPeriod: 86400,
            });
            expect(await testNFT.balanceOf(RentAddress)).to.equal(1);
            expect(await testNFT.ownerOf(1)).to.equal(RentAddress);
            expect(await rent.getNumRentals()).to.equal(1);

            await rent.connect(_renter).startRent(0);
            expect(await acceptableERC20Token.balanceOf(_renter.address)).to.equal(90);
            expect(await acceptableERC20Token.balanceOf(RentAddress)).to.equal(10);

            await expect(rent.connect(_renter).endRental(0)).to.be.revertedWith(
                'you are not the owner and cannot end the rental',
            );
        });
    });
});
