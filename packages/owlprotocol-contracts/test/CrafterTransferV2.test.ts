import { ethers } from 'hardhat';
const { utils } = ethers;
//const { parseUnits } = utils;
import { expect } from 'chai';
import { SignerWithAddress } from '@nomiclabs/hardhat-ethers/signers';
import { pick } from 'lodash';
import { CrafterTransferV2, CrafterTransferV2__factory, ERC721, } from '../typechain';
import { createERC721 } from './utils';

import { ERC1167Factory__factory } from '../typechain/factories/ERC1167Factory__factory';
import { ERC1167Factory } from '../typechain/ERC1167Factory';
import { BigNumber } from 'ethers';

enum ConsumableType {
    unaffected,
    burned,
    locked,
    NTime,
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

    let CrafterTransferV2Factory: CrafterTransferV2__factory;
    let CrafterTransferV2Implementation: CrafterTransferV2;

    let ERC1167FactoryFactory: ERC1167Factory__factory;
    let ERC1167Factory: ERC1167Factory;

    before(async () => {
        // Launch Crafter + implementation
        CrafterTransferV2Factory = (await ethers.getContractFactory('CrafterTransferV2')) as CrafterTransferV2__factory;
        CrafterTransferV2Implementation = await CrafterTransferV2Factory.deploy();

        // Launch ERC1167 Factory
        ERC1167FactoryFactory = (await ethers.getContractFactory('ERC1167Factory')) as ERC1167Factory__factory;
        ERC1167Factory = await ERC1167FactoryFactory.deploy();

        await Promise.all([ERC1167Factory.deployed(), CrafterTransferV2Implementation.deployed()]);

        // Get users
        [owner] = await ethers.getSigners();
    });

    describe('ERC721 (amount[0] = 0, craftableAmount = 2)', async () => {
        const burnAddress = '0x0000000000000000000000000000000000000001';

        let inputERC721: ERC721;
        let outputERC721: ERC721;
        let crafter: CrafterTransferV2;

        let CrafterTransferV2Address: string;

        beforeEach(async () => {
            //Deploy ERC721
            [inputERC721, outputERC721] = await createERC721(2);

            //Crafter Data
            const CrafterTransferV2Data = CrafterTransferV2Implementation.interface.encodeFunctionData('initialize', [
                owner.address,
                burnAddress,
                2,
                //Input any token id
                [
                    {
                        token: TokenType.erc721,
                        consumableType: ConsumableType.NTime,
                        contractAddr: inputERC721.address,
                        amounts: [0],
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
                        tokenIds: [1, 2],
                    },
                ],
            ]);

            //Predict address
            const salt = ethers.utils.formatBytes32String('');
            CrafterTransferV2Address = await ERC1167Factory.predictDeterministicAddress(
                CrafterTransferV2Implementation.address,
                salt,
                CrafterTransferV2Data,
            );

            //Set Approval ERC721 Output
            await outputERC721.connect(owner).approve(CrafterTransferV2Address, 2);
            await outputERC721.connect(owner).approve(CrafterTransferV2Address, 1);

            //Deploy Crafter craftableAmount=1
            //Check balances
            //Clone deterministic
            await ERC1167Factory.cloneDeterministic(
                CrafterTransferV2Implementation.address,
                salt,
                CrafterTransferV2Data,
            );
            crafter = await (ethers.getContractAt(
                'CrafterTransferV2',
                CrafterTransferV2Address,
            ) as Promise<CrafterTransferV2>);
            //Assert transferred
            expect(await inputERC721.ownerOf(1)).to.equal(owner.address);
            expect(await inputERC721.ownerOf(2)).to.equal(owner.address);
            expect(await outputERC721.ownerOf(1)).to.equal(crafter.address);
            expect(await outputERC721.ownerOf(2)).to.equal(crafter.address);

            //Storage tests
            expect(await crafter.craftableAmount(), 'craftableAmount').to.equal(2);

            const inputs = await crafter.getInputs();
            const outputs = await crafter.getOutputs();
            expect(inputs.length).to.equal(1);
            expect(outputs.length).to.equal(1);
            const input0 = await crafter.getInputIngredient(0);
            const output0 = await crafter.getOutputIngredient(0);
            expect(pick(input0, ['token', 'consumableType', 'contractAddr', 'amounts', 'tokenIds'])).to.deep.equal({
                token: 1,
                consumableType: 3,
                contractAddr: inputERC721.address,
                amounts: [BigNumber.from(0)],
                tokenIds: [],
            });
            expect(pick(output0, ['token', 'consumableType', 'contractAddr', 'amounts', 'tokenIds'])).to.deep.equal({
                token: 1,
                consumableType: 0,
                contractAddr: outputERC721.address,
                amounts: [],
                tokenIds: [BigNumber.from(1), BigNumber.from(2)],
            });
        });

        it('craft1', async () => {
            //Craft 1
            await inputERC721.connect(owner).approve(CrafterTransferV2Address, 1);
            await expect(crafter.craft(1, [[1]])).to.be.revertedWith('Used over the limit of n');
            //Check storage
            expect(await crafter.craftableAmount(), 'craftableAmount').to.equal(2);
            //Check balances
            expect(await inputERC721.ownerOf(1)).to.equal(owner.address);
            expect(await outputERC721.ownerOf(1)).to.equal(crafter.address); // this should be owner.address
            expect(await outputERC721.ownerOf(2)).to.equal(crafter.address);
            //Storage tests
            const input0 = await crafter.getInputIngredient(0);
            const output0 = await crafter.getOutputIngredient(0);
            expect(pick(input0, ['token', 'consumableType', 'contractAddr', 'amounts', 'tokenIds'])).to.deep.equal({
                token: TokenType.erc721,
                consumableType: ConsumableType.NTime,
                contractAddr: inputERC721.address,
                amounts: [BigNumber.from(0)],
                tokenIds: [],
            });
            //Empty because crafting pops token id
            expect(pick(output0, ['token', 'consumableType', 'contractAddr', 'amounts', 'tokenIds'])).to.deep.equal({
                token: TokenType.erc721,
                consumableType: ConsumableType.unaffected,
                contractAddr: outputERC721.address,
                amounts: [],
                tokenIds: [BigNumber.from(1), BigNumber.from(2)],
            });
        });

        it('craft2', async () => {
            //Craft 2
            await inputERC721.connect(owner).approve(CrafterTransferV2Address, 1);
            await expect(crafter.craft(1, [[1]])).to.be.revertedWith('Used over the limit of n');

            //Check storage
            expect(await crafter.craftableAmount(), 'craftableAmount').to.equal(2);
            //Check balances
            expect(await inputERC721.ownerOf(1)).to.equal(owner.address);
            expect(await outputERC721.ownerOf(1)).to.equal(crafter.address);
            expect(await outputERC721.ownerOf(2)).to.equal(crafter.address);

            //Storage tests
            const input0 = await crafter.getInputIngredient(0);
            const output0 = await crafter.getOutputIngredient(0);
            expect(pick(input0, ['token', 'consumableType', 'contractAddr', 'amounts', 'tokenIds'])).to.deep.equal({
                token: TokenType.erc721,
                consumableType: ConsumableType.NTime,
                contractAddr: inputERC721.address,
                amounts: [BigNumber.from(0)],
                tokenIds: [],
            });
            //Empty because crafting pops token id
            expect(pick(output0, ['token', 'consumableType', 'contractAddr', 'amounts', 'tokenIds'])).to.deep.equal({
                token: TokenType.erc721,
                consumableType: ConsumableType.unaffected,
                contractAddr: outputERC721.address,
                amounts: [],
                tokenIds: [BigNumber.from(1), BigNumber.from(2)],
            });
        });

        it('craft3', async () => {
            //Craft 3
            await inputERC721.connect(owner).approve(CrafterTransferV2Address, 1);
            await expect(crafter.craft(1, [[1]])).to.be.revertedWith('Used over the limit of n');

            //Check storage
            expect(await crafter.craftableAmount(), 'craftableAmount').to.equal(2);
            //Check balances
            expect(await inputERC721.ownerOf(1)).to.equal(owner.address);
            expect(await outputERC721.ownerOf(1)).to.equal(crafter.address);
            expect(await outputERC721.ownerOf(2)).to.equal(crafter.address);

            //Storage tests
            const input0 = await crafter.getInputIngredient(0);
            const output0 = await crafter.getOutputIngredient(0);
            expect(pick(input0, ['token', 'consumableType', 'contractAddr', 'amounts', 'tokenIds'])).to.deep.equal({
                token: TokenType.erc721,
                consumableType: ConsumableType.NTime,
                contractAddr: inputERC721.address,
                amounts: [BigNumber.from(0)],
                tokenIds: [],
            });
            //Empty because crafting pops token id
            expect(pick(output0, ['token', 'consumableType', 'contractAddr', 'amounts', 'tokenIds'])).to.deep.equal({
                token: TokenType.erc721,
                consumableType: ConsumableType.unaffected,
                contractAddr: outputERC721.address,
                amounts: [],
                tokenIds: [BigNumber.from(1), BigNumber.from(2)],
            });
        });
    });

    describe('ERC721 (amount[0] = 1, craftableAmount = 2)', async () => {
        const burnAddress = '0x0000000000000000000000000000000000000001';

        let inputERC721: ERC721;
        let outputERC721: ERC721;
        let crafter: CrafterTransferV2;

        let CrafterTransferV2Address: string;

        beforeEach(async () => {
            //Deploy ERC721
            [inputERC721, outputERC721] = await createERC721(2);

            //Crafter Data
            const CrafterTransferV2Data = CrafterTransferV2Implementation.interface.encodeFunctionData('initialize', [
                owner.address,
                burnAddress,
                2,
                //Input any token id
                [
                    {
                        token: TokenType.erc721,
                        consumableType: ConsumableType.NTime,
                        contractAddr: inputERC721.address,
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
                        tokenIds: [1, 2],
                    },
                ],
            ]);

            //Predict address
            const salt = ethers.utils.formatBytes32String('');
            CrafterTransferV2Address = await ERC1167Factory.predictDeterministicAddress(
                CrafterTransferV2Implementation.address,
                salt,
                CrafterTransferV2Data,
            );

            //Set Approval ERC721 Output
            await outputERC721.connect(owner).approve(CrafterTransferV2Address, 2);
            await outputERC721.connect(owner).approve(CrafterTransferV2Address, 1);

            //Deploy Crafter craftableAmount=1
            //Check balances
            //Clone deterministic
            await ERC1167Factory.cloneDeterministic(
                CrafterTransferV2Implementation.address,
                salt,
                CrafterTransferV2Data,
            );
            crafter = await (ethers.getContractAt(
                'CrafterTransferV2',
                CrafterTransferV2Address,
            ) as Promise<CrafterTransferV2>);
            //Assert transferred
            expect(await inputERC721.ownerOf(1)).to.equal(owner.address);
            expect(await inputERC721.ownerOf(2)).to.equal(owner.address);
            expect(await outputERC721.ownerOf(1)).to.equal(crafter.address);
            expect(await outputERC721.ownerOf(2)).to.equal(crafter.address);

            //Storage tests
            expect(await crafter.craftableAmount(), 'craftableAmount').to.equal(2);

            const inputs = await crafter.getInputs();
            const outputs = await crafter.getOutputs();
            expect(inputs.length).to.equal(1);
            expect(outputs.length).to.equal(1);
            const input0 = await crafter.getInputIngredient(0);
            const output0 = await crafter.getOutputIngredient(0);
            expect(pick(input0, ['token', 'consumableType', 'contractAddr', 'amounts', 'tokenIds'])).to.deep.equal({
                token: 1,
                consumableType: 3,
                contractAddr: inputERC721.address,
                amounts: [BigNumber.from(1)],
                tokenIds: [],
            });
            expect(pick(output0, ['token', 'consumableType', 'contractAddr', 'amounts', 'tokenIds'])).to.deep.equal({
                token: 1,
                consumableType: 0,
                contractAddr: outputERC721.address,
                amounts: [],
                tokenIds: [BigNumber.from(1), BigNumber.from(2)],
            });
        });

        it('craft1', async () => {
            //Craft 1
            await inputERC721.connect(owner).approve(CrafterTransferV2Address, 1);
            await crafter.craft(1, [[1]]);
            //Check storage
            expect(await crafter.craftableAmount(), 'craftableAmount').to.equal(1);
            //Check balances
            expect(await inputERC721.ownerOf(1)).to.equal(owner.address);
            expect(await outputERC721.ownerOf(1)).to.equal(crafter.address); // this should be owner.address
            expect(await outputERC721.ownerOf(2)).to.equal(owner.address);
            //Storage tests
            const input0 = await crafter.getInputIngredient(0);
            const output0 = await crafter.getOutputIngredient(0);
            expect(pick(input0, ['token', 'consumableType', 'contractAddr', 'amounts', 'tokenIds'])).to.deep.equal({
                token: TokenType.erc721,
                consumableType: ConsumableType.NTime,
                contractAddr: inputERC721.address,
                amounts: [BigNumber.from(1)],
                tokenIds: [],
            });
            //Empty because crafting pops token id
            expect(pick(output0, ['token', 'consumableType', 'contractAddr', 'amounts', 'tokenIds'])).to.deep.equal({
                token: TokenType.erc721,
                consumableType: ConsumableType.unaffected,
                contractAddr: outputERC721.address,
                amounts: [],
                tokenIds: [BigNumber.from(1)],
            });
        });

        it('craft2', async () => {
            //Craft 2
            await inputERC721.connect(owner).approve(CrafterTransferV2Address, 1);
            await crafter.craft(1, [[1]]);
            await expect(crafter.craft(1, [[1]])).to.be.revertedWith('Used over the limit of n');

            //Check storage
            expect(await crafter.craftableAmount(), 'craftableAmount').to.equal(1);
            //Check balances
            expect(await inputERC721.ownerOf(1)).to.equal(owner.address);
            expect(await outputERC721.ownerOf(1)).to.equal(crafter.address);
            expect(await outputERC721.ownerOf(2)).to.equal(owner.address);

            //Storage tests
            const input0 = await crafter.getInputIngredient(0);
            const output0 = await crafter.getOutputIngredient(0);
            expect(pick(input0, ['token', 'consumableType', 'contractAddr', 'amounts', 'tokenIds'])).to.deep.equal({
                token: TokenType.erc721,
                consumableType: ConsumableType.NTime,
                contractAddr: inputERC721.address,
                amounts: [BigNumber.from(1)],
                tokenIds: [],
            });
            //Empty because crafting pops token id
            expect(pick(output0, ['token', 'consumableType', 'contractAddr', 'amounts', 'tokenIds'])).to.deep.equal({
                token: TokenType.erc721,
                consumableType: ConsumableType.unaffected,
                contractAddr: outputERC721.address,
                amounts: [],
                tokenIds: [BigNumber.from(1)],
            });
        });

        it('craft3', async () => {
            //Craft 3
            await inputERC721.connect(owner).approve(CrafterTransferV2Address, 1);
            await crafter.craft(1, [[1]]);
            await expect(crafter.craft(1, [[1]])).to.be.revertedWith('Used over the limit of n');
            await expect(crafter.craft(1, [[1]])).to.be.revertedWith('Used over the limit of n');

            //Check storage
            expect(await crafter.craftableAmount(), 'craftableAmount').to.equal(1);
            //Check balances
            expect(await inputERC721.ownerOf(1)).to.equal(owner.address);
            expect(await outputERC721.ownerOf(1)).to.equal(crafter.address);
            expect(await outputERC721.ownerOf(2)).to.equal(owner.address);

            //Storage tests
            const input0 = await crafter.getInputIngredient(0);
            const output0 = await crafter.getOutputIngredient(0);
            expect(pick(input0, ['token', 'consumableType', 'contractAddr', 'amounts', 'tokenIds'])).to.deep.equal({
                token: TokenType.erc721,
                consumableType: ConsumableType.NTime,
                contractAddr: inputERC721.address,
                amounts: [BigNumber.from(1)],
                tokenIds: [],
            });
            //Empty because crafting pops token id
            expect(pick(output0, ['token', 'consumableType', 'contractAddr', 'amounts', 'tokenIds'])).to.deep.equal({
                token: TokenType.erc721,
                consumableType: ConsumableType.unaffected,
                contractAddr: outputERC721.address,
                amounts: [],
                tokenIds: [BigNumber.from(1)],
            });
        });
    });

    describe('(amount[0] = 2, craftableAmount = 2)', async () => {
        const burnAddress = '0x0000000000000000000000000000000000000001';

        let inputERC721: ERC721;
        let outputERC721: ERC721;
        let crafter: CrafterTransferV2;

        let CrafterTransferV2Address: string;

        beforeEach(async () => {
            //Deploy ERC721
            [inputERC721, outputERC721] = await createERC721(2);

            //Crafter Data
            const CrafterTransferV2Data = CrafterTransferV2Implementation.interface.encodeFunctionData('initialize', [
                owner.address,
                burnAddress,
                2,
                //Input any token id
                [
                    {
                        token: TokenType.erc721,
                        consumableType: ConsumableType.NTime,
                        contractAddr: inputERC721.address,
                        amounts: [2],
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
                        tokenIds: [1, 2],
                    },
                ],
            ]);

            //Predict address
            const salt = ethers.utils.formatBytes32String('');
            CrafterTransferV2Address = await ERC1167Factory.predictDeterministicAddress(
                CrafterTransferV2Implementation.address,
                salt,
                CrafterTransferV2Data,
            );

            //Set Approval ERC721 Output
            await outputERC721.connect(owner).approve(CrafterTransferV2Address, 2);
            await outputERC721.connect(owner).approve(CrafterTransferV2Address, 1);

            //Deploy Crafter craftableAmount=1
            //Check balances
            //Clone deterministic
            await ERC1167Factory.cloneDeterministic(
                CrafterTransferV2Implementation.address,
                salt,
                CrafterTransferV2Data,
            );
            crafter = await (ethers.getContractAt(
                'CrafterTransferV2',
                CrafterTransferV2Address,
            ) as Promise<CrafterTransferV2>);
            //Assert transferred
            expect(await inputERC721.ownerOf(1)).to.equal(owner.address);
            expect(await outputERC721.ownerOf(1)).to.equal(crafter.address);
            expect(await outputERC721.ownerOf(2)).to.equal(crafter.address);

            //Storage tests
            expect(await crafter.craftableAmount(), 'craftableAmount').to.equal(2);

            const inputs = await crafter.getInputs();
            const outputs = await crafter.getOutputs();
            expect(inputs.length).to.equal(1);
            expect(outputs.length).to.equal(1);
            const input0 = await crafter.getInputIngredient(0);
            const output0 = await crafter.getOutputIngredient(0);
            expect(pick(input0, ['token', 'consumableType', 'contractAddr', 'amounts', 'tokenIds'])).to.deep.equal({
                token: 1,
                consumableType: 3,
                contractAddr: inputERC721.address,
                amounts: [BigNumber.from(2)],
                tokenIds: [],
            });
            expect(pick(output0, ['token', 'consumableType', 'contractAddr', 'amounts', 'tokenIds'])).to.deep.equal({
                token: 1,
                consumableType: 0,
                contractAddr: outputERC721.address,
                amounts: [],
                tokenIds: [BigNumber.from(1), BigNumber.from(2)],
            });
        });

        it('craft1', async () => {
            //Craft 1
            await inputERC721.connect(owner).approve(CrafterTransferV2Address, 1);
            await crafter.craft(1, [[1]]);
            //Check storage
            expect(await crafter.craftableAmount(), 'craftableAmount').to.equal(1);
            //Check balances
            expect(await inputERC721.ownerOf(1)).to.equal(owner.address);
            expect(await outputERC721.ownerOf(1)).to.equal(crafter.address);
            expect(await outputERC721.ownerOf(2)).to.equal(owner.address);
            //Storage tests
            const input0 = await crafter.getInputIngredient(0);
            const output0 = await crafter.getOutputIngredient(0);
            expect(pick(input0, ['token', 'consumableType', 'contractAddr', 'amounts', 'tokenIds'])).to.deep.equal({
                token: TokenType.erc721,
                consumableType: ConsumableType.NTime,
                contractAddr: inputERC721.address,
                amounts: [BigNumber.from(2)],
                tokenIds: [],
            });
            //Empty because crafting pops token id
            expect(pick(output0, ['token', 'consumableType', 'contractAddr', 'amounts', 'tokenIds'])).to.deep.equal({
                token: TokenType.erc721,
                consumableType: ConsumableType.unaffected,
                contractAddr: outputERC721.address,
                amounts: [],
                tokenIds: [BigNumber.from(1)],
            });
        });

        it('craft2', async () => {
            //Craft 2
            await inputERC721.connect(owner).approve(CrafterTransferV2Address, 1);
            console.log(await crafter.getOutputIngredient(0));
            await crafter.craft(2, [[1, 1]]);
            console.log(await crafter.getOutputIngredient(0));
            //await crafter.craft(1, [[1]]);

            //Check storage
            expect(await crafter.craftableAmount(), 'craftableAmount').to.equal(0);
            //Check balances
            expect(await inputERC721.ownerOf(1)).to.equal(owner.address);
            expect(await outputERC721.ownerOf(1)).to.equal(owner.address);
            expect(await outputERC721.ownerOf(2)).to.equal(owner.address);

            //Storage tests
            const input0 = await crafter.getInputIngredient(0);
            const output0 = await crafter.getOutputIngredient(0);
            expect(pick(input0, ['token', 'consumableType', 'contractAddr', 'amounts', 'tokenIds'])).to.deep.equal({
                token: TokenType.erc721,
                consumableType: ConsumableType.NTime,
                contractAddr: inputERC721.address,
                amounts: [BigNumber.from(2)],
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

        it('craft3', async () => {
            //Craft 3
            await inputERC721.connect(owner).approve(CrafterTransferV2Address, 1);
            await expect(crafter.craft(3, [[1, 1, 1]])).to.be.revertedWith('Not enough resources to craft!');

            //Check storage
            expect(await crafter.craftableAmount(), 'craftableAmount').to.equal(2);
            //Check balances
            expect(await inputERC721.ownerOf(1)).to.equal(owner.address);
            expect(await outputERC721.ownerOf(1)).to.equal(crafter.address);
            expect(await outputERC721.ownerOf(2)).to.equal(crafter.address);

            //Storage tests
            const input0 = await crafter.getInputIngredient(0);
            const output0 = await crafter.getOutputIngredient(0);
            expect(pick(input0, ['token', 'consumableType', 'contractAddr', 'amounts', 'tokenIds'])).to.deep.equal({
                token: TokenType.erc721,
                consumableType: ConsumableType.NTime,
                contractAddr: inputERC721.address,
                amounts: [BigNumber.from(2)],
                tokenIds: [],
            });
            //Empty because crafting pops token id
            expect(pick(output0, ['token', 'consumableType', 'contractAddr', 'amounts', 'tokenIds'])).to.deep.equal({
                token: TokenType.erc721,
                consumableType: ConsumableType.unaffected,
                contractAddr: outputERC721.address,
                amounts: [],
                tokenIds: [BigNumber.from(1), BigNumber.from(2)],
            });
        });
    });

    describe('multiple ingredients, craftableAmount = 3)', async () => {
        const burnAddress = '0x0000000000000000000000000000000000000001';

        let inputERC721: ERC721;
        let input2ERC721: ERC721;
        let outputERC721: ERC721;
        let output2ERC721: ERC721;
        let crafter: CrafterTransferV2;

        let CrafterTransferV2Address: string;

        beforeEach(async () => {
            //Deploy ERC721
            [inputERC721, input2ERC721, outputERC721, output2ERC721] = await createERC721(4);

            //Crafter Data
            const CrafterTransferV2Data = CrafterTransferV2Implementation.interface.encodeFunctionData('initialize', [
                owner.address,
                burnAddress,
                3,
                //Input any token id
                [
                    {
                        token: TokenType.erc721,
                        consumableType: ConsumableType.NTime,
                        contractAddr: inputERC721.address,
                        amounts: [2],
                        tokenIds: [],
                    },
                    {
                        token: TokenType.erc721,
                        consumableType: ConsumableType.NTime,
                        contractAddr: input2ERC721.address,
                        amounts: [3],
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
                        tokenIds: [1, 2, 4],
                    },
                    {
                        token: TokenType.erc721,
                        consumableType: ConsumableType.unaffected,
                        contractAddr: output2ERC721.address,
                        amounts: [],
                        tokenIds: [2, 1, 3],
                    },
                ],
            ]);

            //Predict address
            const salt = ethers.utils.formatBytes32String('');
            CrafterTransferV2Address = await ERC1167Factory.predictDeterministicAddress(
                CrafterTransferV2Implementation.address,
                salt,
                CrafterTransferV2Data,
            );

            //Set Approval ERC721 Output
            //await outputERC721.connect(owner).setApprovalForAll(CrafterTransferV2Address, true);

            await outputERC721.connect(owner).approve(CrafterTransferV2Address, 1);
            await outputERC721.connect(owner).approve(CrafterTransferV2Address, 2);
            await outputERC721.connect(owner).approve(CrafterTransferV2Address, 4);
            await output2ERC721.connect(owner).approve(CrafterTransferV2Address, 3);
            await output2ERC721.connect(owner).approve(CrafterTransferV2Address, 2);
            await output2ERC721.connect(owner).approve(CrafterTransferV2Address, 1);

            console.log('string', owner.address, CrafterTransferV2Address); //

            //Deploy Crafter craftableAmount=3
            //Check balances
            //Clone deterministic
            await ERC1167Factory.cloneDeterministic(
                CrafterTransferV2Implementation.address,
                salt,
                CrafterTransferV2Data,
            );

            console.log('test'); //this is where the error is. must be something with the ERC1167 factory?

            crafter = await (ethers.getContractAt(
                'CrafterTransferV2',
                CrafterTransferV2Address,
            ) as Promise<CrafterTransferV2>);

            //Assert transferred
            expect(await inputERC721.ownerOf(1)).to.equal(owner.address);
            expect(await inputERC721.ownerOf(2)).to.equal(owner.address);
            expect(await inputERC721.ownerOf(3)).to.equal(owner.address);
            expect(await inputERC721.ownerOf(4)).to.equal(owner.address);

            expect(await outputERC721.ownerOf(1)).to.equal(crafter.address);
            expect(await outputERC721.ownerOf(2)).to.equal(crafter.address);
            expect(await output2ERC721.ownerOf(3)).to.equal(crafter.address);
            expect(await outputERC721.ownerOf(4)).to.equal(crafter.address);
            expect(await output2ERC721.ownerOf(2)).to.equal(crafter.address);
            expect(await output2ERC721.ownerOf(1)).to.equal(crafter.address);

            //Storage tests
            expect(await crafter.craftableAmount(), 'craftableAmount').to.equal(3);

            const inputs = await crafter.getInputs();
            const outputs = await crafter.getOutputs();
            expect(inputs.length).to.equal(2);
            expect(outputs.length).to.equal(2);
            const input0 = await crafter.getInputIngredient(0);
            const input1 = await crafter.getInputIngredient(1);
            const output0 = await crafter.getOutputIngredient(0);
            const output1 = await crafter.getOutputIngredient(1);
            expect(pick(input0, ['token', 'consumableType', 'contractAddr', 'amounts', 'tokenIds'])).to.deep.equal({
                token: 1,
                consumableType: 3,
                contractAddr: inputERC721.address,
                amounts: [BigNumber.from(2)],
                tokenIds: [],
            });
            expect(pick(output0, ['token', 'consumableType', 'contractAddr', 'amounts', 'tokenIds'])).to.deep.equal({
                token: 1,
                consumableType: 0,
                contractAddr: outputERC721.address,
                amounts: [],
                tokenIds: [BigNumber.from(1), BigNumber.from(2), BigNumber.from(4)],
            });
            expect(pick(input1, ['token', 'consumableType', 'contractAddr', 'amounts', 'tokenIds'])).to.deep.equal({
                token: 1,
                consumableType: 3,
                contractAddr: input2ERC721.address,
                amounts: [BigNumber.from(3)],
                tokenIds: [],
            });
            expect(pick(output1, ['token', 'consumableType', 'contractAddr', 'amounts', 'tokenIds'])).to.deep.equal({
                token: 1,
                consumableType: 0,
                contractAddr: output2ERC721.address,
                amounts: [],
                tokenIds: [BigNumber.from(2), BigNumber.from(1), BigNumber.from(3)],
            });
        });

        it('craft1', async () => {
            //Craft 1
            await inputERC721.connect(owner).approve(CrafterTransferV2Address, 1);
            await crafter.craft(1, [[1], [1]]);
            //Check storage
            expect(await crafter.craftableAmount(), 'craftableAmount').to.equal(2);
            //Check balances
            expect(await inputERC721.ownerOf(1)).to.equal(owner.address);

            expect(await output2ERC721.ownerOf(1)).to.equal(crafter.address);
            expect(await output2ERC721.ownerOf(2)).to.equal(crafter.address);
            expect(await output2ERC721.ownerOf(3)).to.equal(owner.address);

            expect(await outputERC721.ownerOf(4)).to.equal(owner.address);
            expect(await outputERC721.ownerOf(2)).to.equal(crafter.address);
            expect(await outputERC721.ownerOf(1)).to.equal(crafter.address);

            //Storage tests
            const input0 = await crafter.getInputIngredient(0);
            const output0 = await crafter.getOutputIngredient(0);
            expect(pick(input0, ['token', 'consumableType', 'contractAddr', 'amounts', 'tokenIds'])).to.deep.equal({
                token: TokenType.erc721,
                consumableType: ConsumableType.NTime,
                contractAddr: inputERC721.address,
                amounts: [BigNumber.from(2)],
                tokenIds: [],
            });
            //Empty because crafting pops token id
            expect(pick(output0, ['token', 'consumableType', 'contractAddr', 'amounts', 'tokenIds'])).to.deep.equal({
                token: TokenType.erc721,
                consumableType: ConsumableType.unaffected,
                contractAddr: outputERC721.address,
                amounts: [],
                tokenIds: [BigNumber.from(1), BigNumber.from(2)],
            });
            const input1 = await crafter.getInputIngredient(1);
            const output1 = await crafter.getOutputIngredient(1);
            expect(pick(input1, ['token', 'consumableType', 'contractAddr', 'amounts', 'tokenIds'])).to.deep.equal({
                token: TokenType.erc721,
                consumableType: ConsumableType.NTime,
                contractAddr: input2ERC721.address,
                amounts: [BigNumber.from(3)],
                tokenIds: [],
            });
            //Empty because crafting pops token id
            expect(pick(output1, ['token', 'consumableType', 'contractAddr', 'amounts', 'tokenIds'])).to.deep.equal({
                token: TokenType.erc721,
                consumableType: ConsumableType.unaffected,
                contractAddr: output2ERC721.address,
                amounts: [],
                tokenIds: [BigNumber.from(2), BigNumber.from(1)],
            });
        });

        /* it('craft2', async () => {
            //Craft 2
            await inputERC721.connect(owner).approve(CrafterTransferV2Address, 1);
            await crafter.craft(1, [[1]]);
            await crafter.craft(1, [[1]]);

            //Check storage
            expect(await crafter.craftableAmount(), 'craftableAmount').to.equal(0);
            //Check balances
            expect(await inputERC721.ownerOf(1)).to.equal(owner.address);
            expect(await outputERC721.ownerOf(1)).to.equal(owner.address);
            expect(await outputERC721.ownerOf(2)).to.equal(owner.address);

            //Storage tests
            const input0 = await crafter.getInputIngredient(0);
            const output0 = await crafter.getOutputIngredient(0);
            expect(pick(input0, ['token', 'consumableType', 'contractAddr', 'amounts', 'tokenIds'])).to.deep.equal({
                token: TokenType.erc721,
                consumableType: ConsumableType.NTime,
                contractAddr: inputERC721.address,
                amounts: [BigNumber.from(2)],
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

        it('craft3', async () => {
            //Craft 3
            await inputERC721.connect(owner).approve(CrafterTransferV2Address, 1);
            await crafter.craft(1, [[1]]);
            await crafter.craft(1, [[1]]);
            await expect(crafter.craft(1, [[1]])).to.be.revertedWith('Not enough resources to craft!');

            //Check storage
            expect(await crafter.craftableAmount(), 'craftableAmount').to.equal(0);
            //Check balances
            expect(await inputERC721.ownerOf(1)).to.equal(owner.address);
            expect(await outputERC721.ownerOf(1)).to.equal(owner.address);
            expect(await outputERC721.ownerOf(2)).to.equal(owner.address);

            //Storage tests
            const input0 = await crafter.getInputIngredient(0);
            const output0 = await crafter.getOutputIngredient(0);
            expect(pick(input0, ['token', 'consumableType', 'contractAddr', 'amounts', 'tokenIds'])).to.deep.equal({
                token: TokenType.erc721,
                consumableType: ConsumableType.NTime,
                contractAddr: inputERC721.address,
                amounts: [BigNumber.from(2)],
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
        });*/
    });
});
