import { ethers } from 'hardhat';
const { utils } = ethers;
const { commify, formatEther, parseUnits } = utils;
import { expect } from 'chai';
import { SignerWithAddress } from '@nomiclabs/hardhat-ethers/signers';
import { CrafterTransfer, CrafterTransfer__factory } from '../typechain';
import { createERC20, createERC721, createERC1155 } from './utils';

import { ERC1167Factory__factory } from '../typechain/factories/ERC1167Factory__factory';
import { ERC1167Factory } from '../typechain/ERC1167Factory';

enum ConsumableType {
    unaffected,
    burned,
    locked,
}

enum TokenType {
    erc20,
    erc721,
    erc1155,
}

describe('Crafter.sol', function () {
    // Extra time
    this.timeout(10000);

    let owner: SignerWithAddress;

    let CrafterTransferFactory: CrafterTransfer__factory;
    let CrafterTransferImplementation: CrafterTransfer;

    let ERC1167FactoryFactory: ERC1167Factory__factory;
    let ERC1167Factory: ERC1167Factory;

    before(async () => {
        // Launch Crafter + implementation
        CrafterTransferFactory = (await ethers.getContractFactory('CrafterTransfer')) as CrafterTransfer__factory;
        CrafterTransferImplementation = await CrafterTransferFactory.deploy();

        // Launch ERC1167 Factory
        ERC1167FactoryFactory = (await ethers.getContractFactory('ERC1167Factory')) as ERC1167Factory__factory;
        ERC1167Factory = await ERC1167FactoryFactory.deploy();

        await Promise.all([ERC1167Factory.deployed(), CrafterTransferImplementation.deployed()]);

        // Get users
        [owner] = await ethers.getSigners();
    });

    it('1 ERC20 -> 1 ERC20', async () => {
        //Deploy ERC20
        //Mints 1,000,000,000 by default
        const [inputERC20, outputERC20] = await createERC20(2);
        //Crafter Data
        const burnAddress = '0x0000000000000000000000000000000000000001';
        const CrafterTransferData = CrafterTransferImplementation.interface.encodeFunctionData('initialize', [
            owner.address,
            burnAddress,
            1,
            [
                {
                    token: TokenType.erc20,
                    consumableType: ConsumableType.burned,
                    contractAddr: inputERC20.address,
                    amounts: [1],
                    tokenIds: [],
                },
            ],
            //Output specific token id, output unaffected
            [
                {
                    token: TokenType.erc20,
                    consumableType: ConsumableType.unaffected,
                    contractAddr: outputERC20.address,
                    amounts: [1],
                    tokenIds: [],
                },
            ],
        ]);

        //Predict address
        const salt = ethers.utils.formatBytes32String('');
        const CrafterTransferAddress = await ERC1167Factory.predictDeterministicAddress(
            CrafterTransferImplementation.address,
            salt,
            CrafterTransferData,
        );

        //Set Approval ERC20 Output
        await outputERC20.connect(owner).approve(CrafterTransferAddress, 1);

        //Deploy Crafter craftableAmount=1
        //Check balances
        //Clone deterministic
        await ERC1167Factory.cloneDeterministic(CrafterTransferImplementation.address, salt, CrafterTransferData);
        const crafter = await ethers.getContractAt('CrafterTransfer', CrafterTransferAddress);
        //Storage tests
        //Assert transferred
        const originalInputBalance = parseUnits('1000000000.0', 'ether');
        const originalOutputBalance = parseUnits('1000000000.0', 'ether');

        expect(await inputERC20.balanceOf(owner.address)).to.equal(originalInputBalance);
        expect(await outputERC20.balanceOf(owner.address)).to.equal(originalOutputBalance.sub(1));
        expect(await outputERC20.balanceOf(crafter.address)).to.equal(1);

        //Craft 1
        await inputERC20.connect(owner).approve(CrafterTransferAddress, 1);
        await crafter.craft(1, [[]]);
        //Check balances
        expect(await inputERC20.balanceOf(burnAddress)).to.equal(1);
        expect(await inputERC20.balanceOf(owner.address)).to.equal(originalInputBalance.sub(1));
        expect(await inputERC20.balanceOf(crafter.address)).to.equal(0);
        expect(await outputERC20.balanceOf(owner.address)).to.equal(originalOutputBalance);
        expect(await outputERC20.balanceOf(crafter.address)).to.equal(0);
    });

    it('1 ERC721 -> 1 ERC721', async () => {
        //Deploy ERC721
        const [inputERC721, outputERC721] = await createERC721(2);
        //Crafter Data
        const burnAddress = '0x0000000000000000000000000000000000000001';
        const CrafterTransferData = CrafterTransferImplementation.interface.encodeFunctionData('initialize', [
            owner.address,
            burnAddress,
            1,
            //Input any token id, input burned
            [
                {
                    token: TokenType.erc721,
                    consumableType: ConsumableType.burned,
                    contractAddr: inputERC721.address,
                    amounts: [],
                    tokenIds: [],
                },
            ],
            //Output specific token id, output unaffected
            [
                {
                    token: TokenType.erc721,
                    consumableType: ConsumableType.unaffected,
                    contractAddr: outputERC721.address,
                    amounts: [],
                    tokenIds: [1],
                },
            ],
        ]);

        //Predict address
        const salt = ethers.utils.formatBytes32String('');
        const CrafterTransferAddress = await ERC1167Factory.predictDeterministicAddress(
            CrafterTransferImplementation.address,
            salt,
            CrafterTransferData,
        );

        //Set Approval ERC721 Output
        await outputERC721.connect(owner).approve(CrafterTransferAddress, 1);

        //Deploy Crafter craftableAmount=1
        //Check balances
        //Clone deterministic
        await ERC1167Factory.cloneDeterministic(CrafterTransferImplementation.address, salt, CrafterTransferData);
        const crafter = await ethers.getContractAt('CrafterTransfer', CrafterTransferAddress);
        //Storage tests
        //Assert transferred
        expect(await inputERC721.ownerOf(1)).to.equal(owner.address);
        expect(await outputERC721.ownerOf(1)).to.equal(crafter.address);

        //Craft 1
        await inputERC721.connect(owner).approve(CrafterTransferAddress, 1);
        await crafter.craft(1, [[1]]);
        //Check balances
        expect(await inputERC721.ownerOf(1)).to.equal(burnAddress);
        expect(await outputERC721.ownerOf(1)).to.equal(owner.address);
    });

    it('1 ERC1155 -> 1 ERC1155', async () => {
        //Deploy ERC1155
        //Mint tokenIds 0-9; 100 each
        const [inputERC1155, outputERC1155] = await createERC1155(2);
        //Crafter Data
        const burnAddress = '0x0000000000000000000000000000000000000001';

        const inputAmount = 10;
        const inputId = 5;

        const outputAmount = 3;
        const outputId = 8;

        const ORIGINAL_AMOUNT = 100;

        const CrafterTransferData = CrafterTransferImplementation.interface.encodeFunctionData('initialize', [
            owner.address,
            burnAddress,
            1,
            //Input any token id, input burned
            [
                {
                    token: TokenType.erc1155,
                    consumableType: ConsumableType.burned,
                    contractAddr: inputERC1155.address,
                    amounts: [inputAmount],
                    tokenIds: [inputId],
                },
            ],
            //Output specific token id, output unaffected
            [
                {
                    token: TokenType.erc1155,
                    consumableType: ConsumableType.unaffected,
                    contractAddr: outputERC1155.address,
                    amounts: [outputAmount],
                    tokenIds: [outputId],
                },
            ],
        ]);

        //Predict address
        const salt = ethers.utils.formatBytes32String('');
        const CrafterTransferAddress = await ERC1167Factory.predictDeterministicAddress(
            CrafterTransferImplementation.address,
            salt,
            CrafterTransferData,
        );

        //Set Approval ERC721 Output
        await outputERC1155.connect(owner).setApprovalForAll(CrafterTransferAddress, true);

        //Deploy Crafter craftableAmount=1
        //Check balances
        //Clone deterministic
        await ERC1167Factory.cloneDeterministic(CrafterTransferImplementation.address, salt, CrafterTransferData);
        const crafter = await ethers.getContractAt('CrafterTransfer', CrafterTransferAddress);
        //Storage tests
        //Assert transferred
        expect(await inputERC1155.balanceOf(owner.address, inputId)).to.equal(ORIGINAL_AMOUNT);
        expect(await outputERC1155.balanceOf(owner.address, outputId)).to.equal(ORIGINAL_AMOUNT - outputAmount);
        expect(await outputERC1155.balanceOf(crafter.address, outputId)).to.equal(outputAmount);

        //Craft 1
        await inputERC1155.connect(owner).setApprovalForAll(CrafterTransferAddress, true);
        await crafter.craft(1, [[]]);
        //Check balances
        expect(await inputERC1155.balanceOf(burnAddress, inputId)).to.equal(inputAmount);
        expect(await inputERC1155.balanceOf(owner.address, inputId)).to.equal(ORIGINAL_AMOUNT - inputAmount);
        expect(await outputERC1155.balanceOf(owner.address, outputId)).to.equal(ORIGINAL_AMOUNT);
    });

    it('1 ERC20, 1 ERC721, 1 ERC1155 -> 1 ERC20, 1 ERC721, 1 ERC1155', async () => {
        //Deploy ERC1155
        //Mints 1,000,000,000 by default
        const [inputERC20, outputERC20] = await createERC20(2);
        const [inputERC721, outputERC721] = await createERC721(2);
        //Mint tokenIds 0-9; 100 each
        const [inputERC1155, outputERC1155] = await createERC1155(2);
        //Crafter Data
        const burnAddress = '0x0000000000000000000000000000000000000001';

        const originalInputBalance = parseUnits('1000000000.0', 'ether');
        const originalOutputBalance = parseUnits('1000000000.0', 'ether');

        const inputAmount1155 = 10;
        const inputId1155 = 5;

        const outputAmount1155 = 3;
        const outputId1155 = 8;

        const ORIGINAL_AMOUNT = 100;

        const CrafterTransferData = CrafterTransferImplementation.interface.encodeFunctionData('initialize', [
            owner.address,
            burnAddress,
            1,
            //Input any token id, input burned
            [
                {
                    token: TokenType.erc20,
                    consumableType: ConsumableType.burned,
                    contractAddr: inputERC20.address,
                    amounts: [1],
                    tokenIds: [],
                },
                {
                    token: TokenType.erc721,
                    consumableType: ConsumableType.burned,
                    contractAddr: inputERC721.address,
                    amounts: [],
                    tokenIds: [],
                },
                {
                    token: TokenType.erc1155,
                    consumableType: ConsumableType.burned,
                    contractAddr: inputERC1155.address,
                    amounts: [inputAmount1155],
                    tokenIds: [inputId1155],
                },
            ],
            //Output specific token id, output unaffected
            [
                {
                    token: TokenType.erc20,
                    consumableType: ConsumableType.unaffected,
                    contractAddr: outputERC20.address,
                    amounts: [1],
                    tokenIds: [],
                },
                {
                    token: TokenType.erc721,
                    consumableType: ConsumableType.unaffected,
                    contractAddr: outputERC721.address,
                    amounts: [],
                    tokenIds: [1],
                },
                {
                    token: TokenType.erc1155,
                    consumableType: ConsumableType.unaffected,
                    contractAddr: outputERC1155.address,
                    amounts: [outputAmount1155],
                    tokenIds: [outputId1155],
                },
            ],
        ]);

        //Predict address
        const salt = ethers.utils.formatBytes32String('');
        const CrafterTransferAddress = await ERC1167Factory.predictDeterministicAddress(
            CrafterTransferImplementation.address,
            salt,
            CrafterTransferData,
        );

        //Set Approval Output
        await outputERC20.connect(owner).approve(CrafterTransferAddress, 1);
        await outputERC721.connect(owner).approve(CrafterTransferAddress, 1);
        await outputERC1155.connect(owner).setApprovalForAll(CrafterTransferAddress, true);

        //Clone deterministic
        await ERC1167Factory.cloneDeterministic(CrafterTransferImplementation.address, salt, CrafterTransferData);
        const crafter = await ethers.getContractAt('CrafterTransfer', CrafterTransferAddress);

        //Storage tests
        //Assert transferred
        expect(await inputERC20.balanceOf(owner.address)).to.equal(originalInputBalance);
        expect(await outputERC20.balanceOf(owner.address)).to.equal(originalOutputBalance.sub(1));
        expect(await outputERC20.balanceOf(crafter.address)).to.equal(1);

        expect(await inputERC721.ownerOf(1)).to.equal(owner.address);
        expect(await outputERC721.ownerOf(1)).to.equal(crafter.address);

        expect(await inputERC1155.balanceOf(owner.address, inputId1155)).to.equal(ORIGINAL_AMOUNT);
        expect(await outputERC1155.balanceOf(owner.address, outputId1155)).to.equal(ORIGINAL_AMOUNT - outputAmount1155);
        expect(await outputERC1155.balanceOf(crafter.address, outputId1155)).to.equal(outputAmount1155);

        //Set Approval Input
        await inputERC20.connect(owner).approve(CrafterTransferAddress, 1);
        await inputERC721.connect(owner).approve(CrafterTransferAddress, 1);
        await inputERC1155.connect(owner).setApprovalForAll(CrafterTransferAddress, true);

        //Craft 1
        await crafter.craft(1, [[1]]);

        //Check balances
        expect(await inputERC20.balanceOf(burnAddress)).to.equal(1);
        expect(await inputERC20.balanceOf(owner.address)).to.equal(originalInputBalance.sub(1));
        expect(await inputERC20.balanceOf(crafter.address)).to.equal(0);
        expect(await outputERC20.balanceOf(owner.address)).to.equal(originalOutputBalance);
        expect(await outputERC20.balanceOf(crafter.address)).to.equal(0);

        expect(await inputERC721.ownerOf(1)).to.equal(burnAddress);
        expect(await outputERC721.ownerOf(1)).to.equal(owner.address);

        expect(await inputERC1155.balanceOf(burnAddress, inputId1155)).to.equal(inputAmount1155);
        expect(await inputERC1155.balanceOf(owner.address, inputId1155)).to.equal(ORIGINAL_AMOUNT - inputAmount1155);
        expect(await outputERC1155.balanceOf(owner.address, outputId1155)).to.equal(ORIGINAL_AMOUNT);
    });
});
