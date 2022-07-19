import { ethers } from 'hardhat';
const { utils } = ethers;
const { parseUnits } = utils;
import { expect } from 'chai';
import { pick } from 'lodash';
import {
    CrafterMint,
    CrafterMint__factory,
    ERC1167Factory,
    ERC1167Factory__factory,
    ERC20,
    ERC721,
    ERC1155,
    FactoryERC721,
    FactoryERC20,
    FactoryERC1155,
    UpgradeableBeaconInitializable__factory,
    UpgradeableBeaconInitializable,
    BeaconProxyInitializable__factory,
    BeaconProxyInitializable,
} from '../../../../typechain';
import {
    createERC20,
    createERC721,
    createERC1155,
    deployCloneWrap,
    deployClone,
    predictDeployClone,
} from '../../utils';
import { BigNumber, Signer } from 'ethers';
import {
    loadSignersSmart,
    loadEnvironment,
    TestingSigner,
    assertBalances,
} from '@owlprotocol/contract-helpers-opengsn/src';
import { SignerWithAddress } from '@nomiclabs/hardhat-ethers/signers';

enum ConsumableType {
    unaffected,
    burned,
}

enum TokenType {
    erc20,
    erc721,
    erc1155,
}

describe('CrafterMint.sol', function () {
    // Extra time
    this.timeout(10000);

    let owner: TestingSigner;
    let signer2: TestingSigner;

    let CrafterMintFactory: CrafterMint__factory;
    let CrafterMintImplementation: CrafterMint;

    let ERC1167FactoryFactory: ERC1167Factory__factory;
    let ERC1167Factory: ERC1167Factory;

    let gsnForwarderAddress: string;

    before(async () => {
        ({ gsnForwarderAddress } = await loadEnvironment(ethers));

        // Launch Crafter + implementation
        CrafterMintFactory = (await ethers.getContractFactory('CrafterMint')) as CrafterMint__factory;
        CrafterMintImplementation = await CrafterMintFactory.deploy();

        // Launch ERC1167 Factory
        ERC1167FactoryFactory = (await ethers.getContractFactory('ERC1167Factory')) as ERC1167Factory__factory;
        ERC1167Factory = await ERC1167FactoryFactory.deploy();

        await Promise.all([ERC1167Factory.deployed(), CrafterMintImplementation.deployed()]);

        // Get users
        [owner, signer2] = await loadSignersSmart(ethers);
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
            [inputERC20, outputERC20] = await createERC20(2, owner);

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
                    gsnForwarderAddress, // forwarder addr
                ],
                ERC1167Factory,
            );

            //Set Approval ERC20 Output
            await outputERC20.approve(CrafterMintAddress, 1);

            //Deploy Crafter craftableAmount=1

            crafter = (
                await deployCloneWrap(
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
                        gsnForwarderAddress, // Forwarder
                    ],
                    ERC1167Factory,
                    undefined,
                    undefined,
                    owner,
                )
            ).contract as CrafterMint;

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
            expect(CrafterMintAddress).to.equal(crafter.address);
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

        it(
            'withdraw',
            assertBalances(ethers, async () => {
                //Withdraw 1
                await crafter.withdraw(1);
                //Check storage
                expect(await crafter.craftableAmount(), 'craftableAmount').to.equal(0);
                //Check balances
                expect(await inputERC20.balanceOf(owner.address)).to.equal(originalInputBalance);
                expect(await inputERC20.balanceOf(crafter.address)).to.equal(0);
                expect(await outputERC20.balanceOf(owner.address)).to.equal(originalOutputBalance);
                expect(await outputERC20.balanceOf(crafter.address)).to.equal(0);
            }),
        );

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

        let inputERC721: FactoryERC721;
        let outputERC721: FactoryERC721;
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
                    gsnForwarderAddress, // forwarder addr
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
                    gsnForwarderAddress, // forwarder addr
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
                    gsnForwarderAddress, // forwarder addr
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
                    gsnForwarderAddress, // forwarder addr
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

        let inputERC20: FactoryERC20;
        let outputERC20: FactoryERC20;

        let originalInputBalance: BigNumber;
        let originalOutputBalance: BigNumber;

        let inputERC721: FactoryERC721;
        let outputERC721: FactoryERC721;

        let inputERC1155: FactoryERC1155;
        let outputERC1155: FactoryERC1155;

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
                    gsnForwarderAddress, // forwarder addr
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
                    gsnForwarderAddress, // forwarder addr
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

        it('deposit arg mismatch', async () => {
            await expect(crafter.deposit(2, [[12]])).to.be.revertedWith('CrafterMint: _outputsERC721Ids[i] != amount');
        });

        it('deposit ERC721 already minted', async () => {
            outputERC721.mint(owner.address, 1)
            await expect(crafter.deposit(1, [[1]])).to.be.revertedWith('CrafterMint: tokenId already minted');
        });

        it('withdraw 0 revert', async () => {
            //Withdraw 1
            await expect(crafter.withdraw(0)).to.be.revertedWith('CrafterMint: amount cannot be 0!');
        });
    });


    describe('Craftable Amount 0', async () => {
        const burnAddress = '0x0000000000000000000000000000000000000001';

        let inputERC721: FactoryERC721;
        let outputERC721: FactoryERC721;
        let inputERC20: FactoryERC20;
        let outputERC20: FactoryERC20;
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
                    0,
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
                            tokenIds: [],
                        },
                    ],
                    gsnForwarderAddress, // forwarder addr
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
                    0,
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
                            tokenIds: [],
                        },
                    ],
                    gsnForwarderAddress, // forwarder addr
                ],
                ERC1167Factory,
            );
            crafter = await (ethers.getContractAt('CrafterMint', CrafterMintAddress) as Promise<CrafterMint>);
        });

        it('deposit with 0 amount', async () => {
            //Deposit 1
            await expect(crafter.deposit(0, [[]])).to.be.revertedWith('CrafterMint: amount cannot be 0!');

        });

        it('withdraw more than craftable amount', async () => {
            await expect(crafter.withdraw(1)).to.be.revertedWith('CrafterMint: Not enough resources to craft!')
        });

        it('beacon proxy initialization', async () => {
            [inputERC20, outputERC20] = await createERC20(2);
            const burnAddress = '0x0000000000000000000000000000000000000001';
            const beaconFactory = (await ethers.getContractFactory(
                'UpgradeableBeaconInitializable',
            )) as UpgradeableBeaconInitializable__factory;
            const beaconImpl = (await beaconFactory.deploy()) as UpgradeableBeaconInitializable;

            const beaconProxyFactory = (await ethers.getContractFactory(
                'BeaconProxyInitializable',
            )) as BeaconProxyInitializable__factory;
            const beaconProxyImpl = (await beaconProxyFactory.deploy()) as BeaconProxyInitializable;

            const { address: beaconAddr } = await deployClone(beaconImpl, [
                owner.address,
                CrafterMintImplementation.address,
            ]);

            const crafterMintArgs = [
                //admin address
                //array of recipe inputs
                //array of recipe outputs
                owner.address,
                burnAddress,
                3,
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
                        token: TokenType.erc721,
                        consumableType: ConsumableType.unaffected,
                        contractAddr: outputERC721.address,
                        amounts: [],
                        tokenIds: [100, 99, 98],
                    },
                ],
                gsnForwarderAddress, // forwarder addr
            ];

            //@ts-ignore
            const data = CrafterMintImplementation.interface.encodeFunctionData('proxyInitialize', crafterMintArgs);
            const beaconProxyAddr = await predictDeployClone(beaconProxyImpl, [
                owner.address,
                beaconAddr,
                data,
            ], ERC1167Factory);
            await inputERC20.connect(owner).approve(beaconProxyAddr, 999);
            await outputERC721.connect(owner).setApprovalForAll(beaconProxyAddr, true);

            await deployClone(beaconProxyImpl, [
                owner.address,
                beaconAddr,
                data,
            ], ERC1167Factory);
            const contrInst = (await ethers.getContractAt('CrafterMint', beaconProxyAddr)) as CrafterMint;

            await contrInst.craft(1, [[]]);
        });
    });

    describe('Transfer input reverts', async () => {
        const burnAddress = '0x0000000000000000000000000000000000000001';

        let inputERC20: FactoryERC20;
        let inputERC721: FactoryERC721;
        let outputERC721: FactoryERC721;
        let inputERC1155: FactoryERC1155;
        let crafter: CrafterMint;

        let CrafterMintAddress: string;

        it('Craft signer does not have enough unaffected ERC20 input to craft', async () => {
            //Deploy ERC721
            [inputERC721, outputERC721] = await createERC721(2, 0);
            [inputERC20] = await createERC20(1);
            [inputERC1155] = await createERC1155(1);

            // await inputERC20.connect(owner).approve()
            await inputERC20.connect(owner).transfer(signer2.address, parseUnits('1.0', 27));

            const crafterArgs = [
                owner.address,
                burnAddress,
                3,
                //Input any token id, input burned
                [
                    {
                        token: TokenType.erc20,
                        consumableType: ConsumableType.unaffected,
                        contractAddr: inputERC20.address,
                        amounts: [5],
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
                        tokenIds: [1, 2, 3],
                    },
                ],
                gsnForwarderAddress, // forwarder addr
            ];

            //Predict address
            CrafterMintAddress = await predictDeployClone(
                CrafterMintImplementation,
                crafterArgs,
                ERC1167Factory,
            );

            //Deploy Crafter craftableAmount=1
            await deployClone(
                CrafterMintImplementation,
                crafterArgs,
                ERC1167Factory,
            );
            crafter = await (ethers.getContractAt('CrafterMint', CrafterMintAddress) as Promise<CrafterMint>);
            await expect(crafter.craft(1, [[]])).to.be.revertedWith('PluginsCore: User missing minimum token balance(s)!');
        });

        it('ERC721 craft input mismatch', async () => {
            //Deploy ERC721
            [outputERC721] = await createERC721(1, 0);
            [inputERC721] = await createERC721(1);
            [inputERC20] = await createERC20(1);
            [inputERC1155] = await createERC1155(1);

            const crafterArgs = [
                owner.address,
                burnAddress,
                3,
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
                        tokenIds: [1, 2, 3],
                    },
                ],
                gsnForwarderAddress, // forwarder addr
            ];

            //Predict address
            CrafterMintAddress = await predictDeployClone(
                CrafterMintImplementation,
                crafterArgs,
                ERC1167Factory,
            );

            //Deploy Crafter craftableAmount=1
            await deployClone(
                CrafterMintImplementation,
                crafterArgs,
                ERC1167Factory,
            );
            crafter = await (ethers.getContractAt('CrafterMint', CrafterMintAddress) as Promise<CrafterMint>);
            await expect(crafter.craft(1, [[1, 2]])).to.be.revertedWith('PluginsCore: _inputERC721Ids[i] != amount');
        });

        it('Craft signer does not have enough ERC1155 unaffected input to craft', async () => {
            //Deploy ERC721
            [outputERC721] = await createERC721(1, 0);
            [inputERC721] = await createERC721(1);
            [inputERC20] = await createERC20(1);
            [inputERC1155] = await createERC1155(1);

            const crafterArgs = [
                owner.address,
                burnAddress,
                3,
                //Input any token id, input burned
                [
                    {
                        token: TokenType.erc1155,
                        consumableType: ConsumableType.unaffected,
                        contractAddr: inputERC1155.address,
                        amounts: [999, 1],
                        tokenIds: [1, 2],
                    },
                ],
                //Output specific token id, output unaffected
                [
                    {
                        token: TokenType.erc721,
                        consumableType: ConsumableType.unaffected,
                        contractAddr: outputERC721.address,
                        amounts: [],
                        tokenIds: [1, 2, 3],
                    },
                ],
                gsnForwarderAddress, // forwarder addr
            ];

            //Predict address
            CrafterMintAddress = await predictDeployClone(
                CrafterMintImplementation,
                crafterArgs,
                ERC1167Factory,
            );

            //Deploy Crafter craftableAmount=1
            await deployClone(
                CrafterMintImplementation,
                crafterArgs,
                ERC1167Factory,
            );
            crafter = await (ethers.getContractAt('CrafterMint', CrafterMintAddress) as Promise<CrafterMint>);
            await expect(crafter.craft(1, [[]])).to.be.revertedWith('PluginsCore: User missing minimum token balance(s)!');
        });
    });
});
