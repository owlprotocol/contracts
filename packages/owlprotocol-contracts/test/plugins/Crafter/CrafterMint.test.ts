import { ethers } from 'hardhat';
const { utils } = ethers;
const { parseUnits } = utils;
import { expect } from 'chai';
import { SignerWithAddress } from '@nomiclabs/hardhat-ethers/signers';
import { pick } from 'lodash';
import {
    CrafterMint,
    CrafterMint__factory,
    ERC1167Factory,
    ERC1167Factory__factory,
    ERC20,
    ERC721,
    ERC1155,
} from '../../../typechain';
import { createERC20, createERC721, createERC1155, deployClone, predictDeployClone } from '../../utils';
import { BigNumber } from 'ethers';

const ZERO_ADDR = '0x' + '0'.repeat(40);

enum ConsumableType {
    unaffected,
    burned,
}

enum TokenType {
    erc20,
    erc721,
    erc1155,
}

describe.only('CrafterMint.sol', function () {
    // Extra time
    this.timeout(10000);

    let owner: SignerWithAddress;

    let CrafterMintFactory: CrafterMint__factory;
    let CrafterMintImplementation: CrafterMint;

    let ERC1167FactoryFactory: ERC1167Factory__factory;
    let ERC1167Factory: ERC1167Factory;

    before(async () => {
        // Launch Crafter + implementation
        CrafterMintFactory = (await ethers.getContractFactory('CrafterMint')) as CrafterMint__factory;
        CrafterMintImplementation = await CrafterMintFactory.deploy();

        // Launch ERC1167 Factory
        ERC1167FactoryFactory = (await ethers.getContractFactory('ERC1167Factory')) as ERC1167Factory__factory;
        ERC1167Factory = await ERC1167FactoryFactory.deploy();

        await Promise.all([ERC1167Factory.deployed(), CrafterMintImplementation.deployed()]);

        // Get users
        [owner] = await ethers.getSigners();
    });

    describe('1 ERC20 -> 1 ERC20', () => {
        const burnAddress = '0x0000000000000000000000000000000000000001';

        let inputERC20: ERC20;
        let outputERC20: ERC20;
        let crafter: CrafterMint;

        let CrafterMintAddress: string;
        let originalInputBalance: BigNumber;
        let originalOutputBalance: BigNumber;

        beforeEach(async () => {
            //Deploy ERC20
            //Mints 1,000,000,000 by default
            [inputERC20, outputERC20] = await createERC20(2);

            // predict address
            CrafterMintAddress = await predictDeployClone(
                CrafterMintImplementation,
                [
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
                    ZERO_ADDR, // forwarder addr
                ],
                ERC1167Factory,
            );

            //Set Approval ERC20 Output
            await outputERC20.connect(owner).approve(CrafterMintAddress, 1);

            //Deploy Crafter craftableAmount=1

            await deployClone(
                CrafterMintImplementation,
                [
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
                    ZERO_ADDR, // Forwarder
                ],
                ERC1167Factory,
            );

            crafter = (await ethers.getContractAt('CrafterMint', CrafterMintAddress)) as CrafterMint;
            //Assert not transferred
            originalInputBalance = parseUnits('1000000000.0', 'ether');
            originalOutputBalance = parseUnits('1000000000.0', 'ether');

            expect(await inputERC20.balanceOf(owner.address)).to.equal(originalInputBalance);
            expect(await outputERC20.balanceOf(owner.address)).to.equal(originalOutputBalance);
            expect(await outputERC20.balanceOf(crafter.address)).to.equal(0);
            //Storage tests
            expect(await crafter.craftableAmount(), 'craftableAmount').to.equal(1);

            const inputs = await crafter.getInputs();
            const outputs = await crafter.getOutputs();
            expect(inputs.length).to.equal(1);
            expect(outputs.length).to.equal(1);
            const input0 = await crafter.getInputIngredient(0);
            const output0 = await crafter.getOutputIngredient(0);
            expect(pick(input0, ['token', 'consumableType', 'contractAddr', 'amounts', 'tokenIds'])).to.deep.equal({
                token: TokenType.erc20,
                consumableType: ConsumableType.burned,
                contractAddr: inputERC20.address,
                amounts: [BigNumber.from(1)],
                tokenIds: [],
            });
            expect(pick(output0, ['token', 'consumableType', 'contractAddr', 'amounts', 'tokenIds'])).to.deep.equal({
                token: TokenType.erc20,
                consumableType: ConsumableType.unaffected,
                contractAddr: outputERC20.address,
                amounts: [BigNumber.from(1)],
                tokenIds: [],
            });
        });

        it('craft', async () => {
            //Craft 1
            await inputERC20.connect(owner).approve(CrafterMintAddress, 1);
            await crafter.craft(1, [[]]);
            //Check storage
            expect(await crafter.craftableAmount(), 'craftableAmount').to.equal(0);
            //Check balances
            expect(await inputERC20.balanceOf(burnAddress)).to.equal(1);
            expect(await inputERC20.balanceOf(owner.address)).to.equal(originalInputBalance.sub(1));
            expect(await inputERC20.balanceOf(crafter.address)).to.equal(0);
            expect(await outputERC20.balanceOf(owner.address)).to.equal(originalOutputBalance.add(1));
            expect(await outputERC20.balanceOf(crafter.address)).to.equal(0);
        });

        it('withdraw', async () => {
            //Withdraw 1
            await crafter.withdraw(1);
            //Check storage
            expect(await crafter.craftableAmount(), 'craftableAmount').to.equal(0);
            //Check balances
            expect(await inputERC20.balanceOf(owner.address)).to.equal(originalInputBalance);
            expect(await inputERC20.balanceOf(crafter.address)).to.equal(0);
            expect(await outputERC20.balanceOf(owner.address)).to.equal(originalOutputBalance);
            expect(await outputERC20.balanceOf(crafter.address)).to.equal(0);
        });

        it('deposit', async () => {
            //Deposit 1
            await outputERC20.connect(owner).approve(CrafterMintAddress, 1);
            await crafter.deposit(1, [[]]);
            //Check storage
            expect(await crafter.craftableAmount(), 'craftableAmount').to.equal(2);
            //Check balances
            expect(await inputERC20.balanceOf(owner.address)).to.equal(originalInputBalance);
            expect(await inputERC20.balanceOf(crafter.address)).to.equal(0);
            expect(await outputERC20.balanceOf(owner.address)).to.equal(originalOutputBalance);
            expect(await outputERC20.balanceOf(crafter.address)).to.equal(0);

            //Craft 1
            await inputERC20.connect(owner).approve(CrafterMintAddress, 1);
            await crafter.craft(1, [[]]);
            //Check storage
            expect(await crafter.craftableAmount(), 'craftableAmount').to.equal(1);
        });

        afterEach(async () => {
            //Storage tests - unchanged
            const input0 = await crafter.getInputIngredient(0);
            const output0 = await crafter.getOutputIngredient(0);
            expect(pick(input0, ['token', 'consumableType', 'contractAddr', 'amounts', 'tokenIds'])).to.deep.equal({
                token: TokenType.erc20,
                consumableType: ConsumableType.burned,
                contractAddr: inputERC20.address,
                amounts: [BigNumber.from(1)],
                tokenIds: [],
            });
            expect(pick(output0, ['token', 'consumableType', 'contractAddr', 'amounts', 'tokenIds'])).to.deep.equal({
                token: TokenType.erc20,
                consumableType: ConsumableType.unaffected,
                contractAddr: outputERC20.address,
                amounts: [BigNumber.from(1)],
                tokenIds: [],
            });
        });
    });

    describe('1 ERC721 -> 1 ERC721', async () => {
        const burnAddress = '0x0000000000000000000000000000000000000001';

        let inputERC721: ERC721;
        let outputERC721: ERC721;
        let crafter: CrafterMint;

        let CrafterMintAddress: string;

        beforeEach(async () => {
            //Deploy ERC721
            [inputERC721, outputERC721] = await createERC721(2);

            //Predict address
            CrafterMintAddress = await predictDeployClone(
                CrafterMintImplementation,
                [
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
                            tokenIds: [11],
                        },
                    ],
                    ZERO_ADDR, // forwarder addr
                ],
                ERC1167Factory,
            );

            //Set Approval ERC721 Output
            await outputERC721.connect(owner).approve(CrafterMintAddress, 1);

            //Deploy Crafter craftableAmount=1
            await deployClone(
                CrafterMintImplementation,
                [
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
                            tokenIds: [11],
                        },
                    ],
                    ZERO_ADDR, // forwarder addr
                ],
                ERC1167Factory,
            );
            crafter = await (ethers.getContractAt('CrafterMint', CrafterMintAddress) as Promise<CrafterMint>);
            //Assert not transferred
            expect(await inputERC721.ownerOf(1)).to.equal(owner.address);
            expect(await outputERC721.ownerOf(1)).to.equal(owner.address);

            //Storage tests
            expect(await crafter.craftableAmount(), 'craftableAmount').to.equal(1);

            const inputs = await crafter.getInputs();
            const outputs = await crafter.getOutputs();
            expect(inputs.length).to.equal(1);
            expect(outputs.length).to.equal(1);
            const input0 = await crafter.getInputIngredient(0);
            const output0 = await crafter.getOutputIngredient(0);
            expect(pick(input0, ['token', 'consumableType', 'contractAddr', 'amounts', 'tokenIds'])).to.deep.equal({
                token: 1,
                consumableType: 1,
                contractAddr: inputERC721.address,
                amounts: [],
                tokenIds: [],
            });
            expect(pick(output0, ['token', 'consumableType', 'contractAddr', 'amounts', 'tokenIds'])).to.deep.equal({
                token: 1,
                consumableType: 0,
                contractAddr: outputERC721.address,
                amounts: [],
                tokenIds: [BigNumber.from(11)],
            });
        });

        it('craft', async () => {
            //Craft 1
            await inputERC721.connect(owner).approve(CrafterMintAddress, 1);
            await crafter.craft(1, [[1]]);
            //Check storage
            expect(await crafter.craftableAmount(), 'craftableAmount').to.equal(0);
            //Check balances
            expect(await inputERC721.ownerOf(1)).to.equal(burnAddress);
            expect(await outputERC721.ownerOf(1)).to.equal(owner.address);
            expect(await outputERC721.ownerOf(11)).to.equal(owner.address);

            //Storage tests
            const input0 = await crafter.getInputIngredient(0);
            const output0 = await crafter.getOutputIngredient(0);
            expect(pick(input0, ['token', 'consumableType', 'contractAddr', 'amounts', 'tokenIds'])).to.deep.equal({
                token: TokenType.erc721,
                consumableType: ConsumableType.burned,
                contractAddr: inputERC721.address,
                amounts: [],
                tokenIds: [],
            });
            //Empty because crafting pops token id
            expect(pick(output0, ['token', 'consumableType', 'contractAddr', 'amounts', 'tokenIds'])).to.deep.equal({
                token: TokenType.erc721,
                consumableType: ConsumableType.unaffected,
                contractAddr: outputERC721.address,
                amounts: [],
                tokenIds: [],
            });
        });

        it('withdraw', async () => {
            //Withdraw 1
            await crafter.withdraw(1);
            //Check storage
            expect(await crafter.craftableAmount(), 'craftableAmount').to.equal(0);
            //Check balances
            expect(await inputERC721.ownerOf(1)).to.equal(owner.address);
            expect(await outputERC721.ownerOf(1)).to.equal(owner.address);
            //Storage tests
            const input0 = await crafter.getInputIngredient(0);
            const output0 = await crafter.getOutputIngredient(0);
            expect(pick(input0, ['token', 'consumableType', 'contractAddr', 'amounts', 'tokenIds'])).to.deep.equal({
                token: TokenType.erc721,
                consumableType: ConsumableType.burned,
                contractAddr: inputERC721.address,
                amounts: [],
                tokenIds: [],
            });
            //Empty because withdraw pops token id
            expect(pick(output0, ['token', 'consumableType', 'contractAddr', 'amounts', 'tokenIds'])).to.deep.equal({
                token: TokenType.erc721,
                consumableType: ConsumableType.unaffected,
                contractAddr: outputERC721.address,
                amounts: [],
                tokenIds: [],
            });
        });

        it('deposit', async () => {
            //Deposit 1
            await outputERC721.connect(owner).setApprovalForAll(CrafterMintAddress, true);
            await crafter.deposit(1, [[12]]);
            //Check storage
            expect(await crafter.craftableAmount(), 'craftableAmount').to.equal(2);
            //Storage tests
            const input0 = await crafter.getInputIngredient(0);
            const output0 = await crafter.getOutputIngredient(0);
            expect(pick(input0, ['token', 'consumableType', 'contractAddr', 'amounts', 'tokenIds'])).to.deep.equal({
                token: TokenType.erc721,
                consumableType: ConsumableType.burned,
                contractAddr: inputERC721.address,
                amounts: [],
                tokenIds: [],
            });
            //Additional token id pushed by deposit
            expect(pick(output0, ['token', 'consumableType', 'contractAddr', 'amounts', 'tokenIds'])).to.deep.equal({
                token: TokenType.erc721,
                consumableType: ConsumableType.unaffected,
                contractAddr: outputERC721.address,
                amounts: [],
                tokenIds: [BigNumber.from(11), BigNumber.from(12)],
            });
            //Craft 1
            await inputERC721.connect(owner).setApprovalForAll(CrafterMintAddress, true);
            await crafter.craft(1, [[1]]);
            //Check storage
            expect(await crafter.craftableAmount(), 'craftableAmount').to.equal(1);
        });
    });

    describe('1 ERC1155 -> 1 ERC1155', async () => {
        const burnAddress = '0x0000000000000000000000000000000000000001';

        let inputERC1155: ERC1155;
        let outputERC1155: ERC1155;
        let crafter: CrafterMint;

        let CrafterMintAddress: string;
        const inputAmount = BigNumber.from(10);
        const inputId = BigNumber.from(5);

        const outputAmount = BigNumber.from(3);
        const outputId = BigNumber.from(8);

        const ORIGINAL_AMOUNT = BigNumber.from(100);

        beforeEach(async () => {
            //Deploy ERC1155
            //Mint tokenIds 0-9; 100 each
            [inputERC1155, outputERC1155] = await createERC1155(2);
            //Crafter Data

            CrafterMintAddress = await predictDeployClone(
                CrafterMintImplementation,
                [
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
                    ZERO_ADDR, // forwarder addr
                ],
                ERC1167Factory,
            );

            //Set Approval ERC721 Output
            await outputERC1155.connect(owner).setApprovalForAll(CrafterMintAddress, true);

            //Deploy Crafter craftableAmount=1
            await deployClone(
                CrafterMintImplementation,
                [
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
                    ZERO_ADDR, // forwarder addr
                ],
                ERC1167Factory,
            );
            crafter = await (ethers.getContractAt('CrafterMint', CrafterMintAddress) as Promise<CrafterMint>);
            //Assert not transferred
            expect(await inputERC1155.balanceOf(owner.address, inputId)).to.equal(ORIGINAL_AMOUNT);
            expect(await outputERC1155.balanceOf(owner.address, outputId)).to.equal(ORIGINAL_AMOUNT);
            expect(await outputERC1155.balanceOf(crafter.address, outputId)).to.equal(0);

            //Storage tests
            expect(await crafter.craftableAmount(), 'craftableAmount').to.equal(1);

            const inputs = await crafter.getInputs();
            const outputs = await crafter.getOutputs();
            expect(inputs.length).to.equal(1);
            expect(outputs.length).to.equal(1);
            const input0 = await crafter.getInputIngredient(0);
            const output0 = await crafter.getOutputIngredient(0);
            expect(pick(input0, ['token', 'consumableType', 'contractAddr', 'amounts', 'tokenIds'])).to.deep.equal({
                token: 2,
                consumableType: 1,
                contractAddr: inputERC1155.address,
                amounts: [inputAmount],
                tokenIds: [inputId],
            });
            expect(pick(output0, ['token', 'consumableType', 'contractAddr', 'amounts', 'tokenIds'])).to.deep.equal({
                token: 2,
                consumableType: 0,
                contractAddr: outputERC1155.address,
                amounts: [outputAmount],
                tokenIds: [outputId],
            });
        });

        it('craft', async () => {
            //Craft 1
            await inputERC1155.connect(owner).setApprovalForAll(CrafterMintAddress, true);
            await crafter.craft(1, [[]]);
            //Check storage
            expect(await crafter.craftableAmount(), 'craftableAmount').to.equal(0);
            //Check balances
            expect(await inputERC1155.balanceOf(burnAddress, inputId)).to.equal(inputAmount);
            expect(await inputERC1155.balanceOf(owner.address, inputId)).to.equal(ORIGINAL_AMOUNT.sub(inputAmount));
            expect(await outputERC1155.balanceOf(owner.address, outputId)).to.equal(ORIGINAL_AMOUNT.add(outputAmount));
        });

        it('withdraw', async () => {
            //Withdraw 1
            await crafter.withdraw(1);
            //Check storage
            expect(await crafter.craftableAmount(), 'craftableAmount').to.equal(0);
            //Check balances
            expect(await inputERC1155.balanceOf(owner.address, inputId)).to.equal(ORIGINAL_AMOUNT);
            expect(await inputERC1155.balanceOf(crafter.address, inputId)).to.equal(0);
            expect(await outputERC1155.balanceOf(owner.address, outputId)).to.equal(ORIGINAL_AMOUNT);
            expect(await outputERC1155.balanceOf(crafter.address, outputId)).to.equal(0);
        });

        it('deposit', async () => {
            //Deposit 1
            await outputERC1155.connect(owner).setApprovalForAll(CrafterMintAddress, true);
            await crafter.deposit(1, []);
            //Check storage
            expect(await crafter.craftableAmount(), 'craftableAmount').to.equal(2);
            //Check balances
            expect(await outputERC1155.balanceOf(crafter.address, outputId)).to.equal(0);
            //Craft 1
            await inputERC1155.connect(owner).setApprovalForAll(CrafterMintAddress, true);
            await crafter.craft(1, [[]]);
            //Check storage
            expect(await crafter.craftableAmount(), 'craftableAmount').to.equal(1);
        });

        afterEach(async () => {
            //Storage tests - unchanged
            const input0 = await crafter.getInputIngredient(0);
            const output0 = await crafter.getOutputIngredient(0);
            expect(pick(input0, ['token', 'consumableType', 'contractAddr', 'amounts', 'tokenIds'])).to.deep.equal({
                token: TokenType.erc1155,
                consumableType: ConsumableType.burned,
                contractAddr: inputERC1155.address,
                amounts: [inputAmount],
                tokenIds: [inputId],
            });
            expect(pick(output0, ['token', 'consumableType', 'contractAddr', 'amounts', 'tokenIds'])).to.deep.equal({
                token: TokenType.erc1155,
                consumableType: ConsumableType.unaffected,
                contractAddr: outputERC1155.address,
                amounts: [outputAmount],
                tokenIds: [outputId],
            });
        });
    });

    describe('1 ERC20, 1 ERC721, 1 ERC1155 -> 1 ERC20, 1 ERC721, 1 ERC1155', async () => {
        const burnAddress = '0x0000000000000000000000000000000000000001';

        let CrafterMintAddress: string;
        let crafter: CrafterMint;

        let inputERC20: ERC20;
        let outputERC20: ERC20;

        let originalInputBalance: BigNumber;
        let originalOutputBalance: BigNumber;

        let inputERC721: ERC721;
        let outputERC721: ERC721;

        let inputERC1155: ERC1155;
        let outputERC1155: ERC1155;

        const inputAmount1155 = BigNumber.from(10);
        const inputId1155 = BigNumber.from(5);

        const outputAmount1155 = BigNumber.from(3);
        const outputId1155 = BigNumber.from(8);
        const ORIGINAL_AMOUNT = BigNumber.from(100);

        beforeEach(async () => {
            //Deploy ERC1155
            //Mints 1,000,000,000 by default
            [inputERC20, outputERC20] = await createERC20(2);
            [inputERC721, outputERC721] = await createERC721(2);
            //Mint tokenIds 0-9; 100 each
            [inputERC1155, outputERC1155] = await createERC1155(2);

            originalInputBalance = parseUnits('1000000000.0', 'ether');
            originalOutputBalance = parseUnits('1000000000.0', 'ether');

            //predict address
            CrafterMintAddress = await predictDeployClone(
                CrafterMintImplementation,
                [
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
                            tokenIds: [11],
                        },
                        {
                            token: TokenType.erc1155,
                            consumableType: ConsumableType.unaffected,
                            contractAddr: outputERC1155.address,
                            amounts: [outputAmount1155],
                            tokenIds: [outputId1155],
                        },
                    ],
                    ZERO_ADDR, // forwarder addr
                ],
                ERC1167Factory,
            );

            //Set Approval Output
            await outputERC20.connect(owner).approve(CrafterMintAddress, 1);
            await outputERC721.connect(owner).approve(CrafterMintAddress, 1);
            await outputERC1155.connect(owner).setApprovalForAll(CrafterMintAddress, true);

            //deploy
            await deployClone(
                CrafterMintImplementation,
                [
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
                            tokenIds: [11],
                        },
                        {
                            token: TokenType.erc1155,
                            consumableType: ConsumableType.unaffected,
                            contractAddr: outputERC1155.address,
                            amounts: [outputAmount1155],
                            tokenIds: [outputId1155],
                        },
                    ],
                    ZERO_ADDR, // forwarder addr
                ],
                ERC1167Factory,
            );
            crafter = await (ethers.getContractAt('CrafterMint', CrafterMintAddress) as Promise<CrafterMint>);

            //Storage tests
            //Assert not transferred
            expect(await inputERC20.balanceOf(owner.address)).to.equal(originalInputBalance);
            expect(await outputERC20.balanceOf(owner.address)).to.equal(originalOutputBalance);
            expect(await outputERC20.balanceOf(crafter.address)).to.equal(0);

            expect(await inputERC721.ownerOf(1)).to.equal(owner.address);
            expect(await outputERC721.ownerOf(1)).to.equal(owner.address);

            expect(await inputERC1155.balanceOf(owner.address, inputId1155)).to.equal(ORIGINAL_AMOUNT);
            expect(await outputERC1155.balanceOf(owner.address, outputId1155)).to.equal(ORIGINAL_AMOUNT);
            expect(await outputERC1155.balanceOf(crafter.address, outputId1155)).to.equal(0);

            //Set Approval Input
            await inputERC20.connect(owner).approve(CrafterMintAddress, 1);
            await inputERC721.connect(owner).approve(CrafterMintAddress, 1);
            await inputERC1155.connect(owner).setApprovalForAll(CrafterMintAddress, true);

            //Storage tests
            const inputs = await crafter.getInputs();
            const outputs = await crafter.getOutputs();
            expect(inputs.length).to.equal(3);
            expect(outputs.length).to.equal(3);

            const input0 = await crafter.getInputIngredient(0);
            const output0 = await crafter.getOutputIngredient(0);
            expect(pick(input0, ['token', 'consumableType', 'contractAddr', 'amounts', 'tokenIds'])).to.deep.equal({
                token: TokenType.erc20,
                consumableType: ConsumableType.burned,
                contractAddr: inputERC20.address,
                amounts: [BigNumber.from(1)],
                tokenIds: [],
            });
            expect(pick(output0, ['token', 'consumableType', 'contractAddr', 'amounts', 'tokenIds'])).to.deep.equal({
                token: TokenType.erc20,
                consumableType: ConsumableType.unaffected,
                contractAddr: outputERC20.address,
                amounts: [BigNumber.from(1)],
                tokenIds: [],
            });

            const input1 = await crafter.getInputIngredient(1);
            const output1 = await crafter.getOutputIngredient(1);
            expect(pick(input1, ['token', 'consumableType', 'contractAddr', 'amounts', 'tokenIds'])).to.deep.equal({
                token: 1,
                consumableType: 1,
                contractAddr: inputERC721.address,
                amounts: [],
                tokenIds: [],
            });
            expect(pick(output1, ['token', 'consumableType', 'contractAddr', 'amounts', 'tokenIds'])).to.deep.equal({
                token: 1,
                consumableType: 0,
                contractAddr: outputERC721.address,
                amounts: [],
                tokenIds: [BigNumber.from(11)],
            });

            const input2 = await crafter.getInputIngredient(2);
            const output2 = await crafter.getOutputIngredient(2);
            expect(pick(input2, ['token', 'consumableType', 'contractAddr', 'amounts', 'tokenIds'])).to.deep.equal({
                token: 2,
                consumableType: 1,
                contractAddr: inputERC1155.address,
                amounts: [inputAmount1155],
                tokenIds: [inputId1155],
            });
            expect(pick(output2, ['token', 'consumableType', 'contractAddr', 'amounts', 'tokenIds'])).to.deep.equal({
                token: 2,
                consumableType: 0,
                contractAddr: outputERC1155.address,
                amounts: [outputAmount1155],
                tokenIds: [outputId1155],
            });
        });

        it('craft', async () => {
            //Craft 1
            await crafter.craft(1, [[1]]);

            //Check balances
            expect(await inputERC20.balanceOf(burnAddress)).to.equal(1);
            expect(await inputERC20.balanceOf(owner.address)).to.equal(originalInputBalance.sub(1));
            expect(await inputERC20.balanceOf(crafter.address)).to.equal(0);
            expect(await outputERC20.balanceOf(owner.address)).to.equal(originalOutputBalance.add(1));
            expect(await outputERC20.balanceOf(crafter.address)).to.equal(0);

            expect(await inputERC721.ownerOf(1)).to.equal(burnAddress);
            expect(await outputERC721.ownerOf(1)).to.equal(owner.address);
            expect(await outputERC721.ownerOf(11)).to.equal(owner.address);

            expect(await inputERC1155.balanceOf(burnAddress, inputId1155)).to.equal(inputAmount1155);
            expect(await inputERC1155.balanceOf(owner.address, inputId1155)).to.equal(
                ORIGINAL_AMOUNT.sub(inputAmount1155),
            );
            expect(await outputERC1155.balanceOf(owner.address, outputId1155)).to.equal(
                ORIGINAL_AMOUNT.add(outputAmount1155),
            );
        });

        it('withdraw', async () => {
            //Withdraw 1
            await crafter.withdraw(1);
            //Check balances
            expect(await inputERC20.balanceOf(owner.address)).to.equal(originalInputBalance);
            expect(await inputERC20.balanceOf(crafter.address)).to.equal(0);
            expect(await outputERC20.balanceOf(owner.address)).to.equal(originalOutputBalance);
            expect(await outputERC20.balanceOf(crafter.address)).to.equal(0);

            expect(await inputERC721.ownerOf(1)).to.equal(owner.address);
            expect(await outputERC721.ownerOf(1)).to.equal(owner.address);

            expect(await inputERC1155.balanceOf(owner.address, inputId1155)).to.equal(ORIGINAL_AMOUNT);
            expect(await inputERC1155.balanceOf(crafter.address, inputId1155)).to.equal(0);
            expect(await outputERC1155.balanceOf(owner.address, outputId1155)).to.equal(ORIGINAL_AMOUNT);
            expect(await outputERC1155.balanceOf(crafter.address, outputId1155)).to.equal(0);
        });

        it('deposit', async () => {
            //Deposit 1
            await outputERC20.connect(owner).approve(CrafterMintAddress, 1);
            await outputERC721.connect(owner).setApprovalForAll(CrafterMintAddress, true);
            await outputERC1155.connect(owner).setApprovalForAll(CrafterMintAddress, true);
            await crafter.deposit(1, [[12]]);
            //Check balances
            expect(await inputERC20.balanceOf(owner.address)).to.equal(originalInputBalance);
            expect(await inputERC20.balanceOf(crafter.address)).to.equal(0);
            expect(await outputERC20.balanceOf(owner.address)).to.equal(originalOutputBalance);
            expect(await outputERC20.balanceOf(crafter.address)).to.equal(0);

            expect(await outputERC1155.balanceOf(crafter.address, outputId1155)).to.equal(0);
        });
    });
});
