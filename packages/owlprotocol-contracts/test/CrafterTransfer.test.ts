import { ethers } from 'hardhat';
import { expect } from 'chai';
import { SignerWithAddress } from '@nomiclabs/hardhat-ethers/signers';
import { CrafterTransfer, CrafterTransfer__factory, FactoryERC1155, FactoryERC20, FactoryERC721 } from '../typechain';
import { createERC20 } from './Helpers/FactoryERC20.test';
import { createERC721 } from './Helpers/FactoryERC721.test';
import { createERC1155 } from './Helpers/FactoryERC1155.test';
import { BigNumberish } from 'ethers';
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

interface Ingredient {
    token: TokenType;
    consumableType: ConsumableType;
    contractAddr: string;
    amounts: BigNumberish[];
    tokenIds: BigNumberish[];
}

describe('Crafter.sol', function () {
    // Extra time
    this.timeout(10000);

    let owner: SignerWithAddress;
    let burnAddress: SignerWithAddress;

    let CrafterTransferFactory: CrafterTransfer__factory;
    let CrafterTransferImplementation: CrafterTransfer;

    let ERC1167FactoryFactory: ERC1167Factory__factory;
    let ERC1167Factory: ERC1167Factory;

    let nonce = 0;

    before(async () => {
        // Launch Crafter + implementation
        CrafterTransferFactory = await ethers.getContractFactory('CrafterTransfer');
        CrafterTransferImplementation = await CrafterTransferFactory.deploy();

        // Launch ERC1167 Factory
        ERC1167FactoryFactory = await ethers.getContractFactory('ERC1167Factory');
        ERC1167Factory = await ERC1167FactoryFactory.deploy();

        await Promise.all([ERC1167Factory.deployed(), CrafterTransferImplementation.deployed()]);

        // Get users
        [owner, burnAddress] = await ethers.getSigners();
    });

    async function getCrafter(inputs: Ingredient[], outputs: Ingredient[]) {
        // Get Crafter (salt with nonce)
        const salt = ethers.utils.formatBytes32String(String(nonce++));

        // Setup crafter data
        const CrafterTransferData = CrafterTransferImplementation.interface.encodeFunctionData('initialize', [
            owner.address,
            burnAddress.address,
            1,
            inputs,
            outputs,
        ]);

        // Predict address
        const CrafterTransferAddress = await ERC1167Factory.predictDeterministicAddress(
            CrafterTransferImplementation.address,
            salt,
            CrafterTransferData,
        );

        // Clone deterministic
        await ERC1167Factory.cloneDeterministic(CrafterTransferImplementation.address, salt, CrafterTransferData);
        const crafter = await ethers.getContractAt('CrafterTransfer', CrafterTransferAddress);

        return crafter;
    }

    async function getIngredients(consumableType = ConsumableType.burned, craftableAmount: number = 1) {
        const tokensERC20 = await createERC20(2);
        const tokensERC721 = await createERC721(2);
        const tokensERC1155 = await createERC1155(2);
        // const [inputERC1155, outputERC1155] = await createERC1155(2);
        // TODO - ERC1155
        const inputERC20: Ingredient = {
            token: TokenType.erc20,
            consumableType: consumableType,
            contractAddr: tokensERC20[0].address,
            amounts: [10],
            tokenIds: [],
        };

        const outputERC20: Ingredient = {
            token: TokenType.erc20,
            consumableType: consumableType,
            contractAddr: tokensERC20[1].address,
            amounts: [10],
            tokenIds: [],
        };

        const tokenIds: number[] = [];

        for (let i = 0; i < craftableAmount; i++) {
            tokenIds.push(i + 1);
        }

        console.log(tokenIds);

        const inputERC721: Ingredient = {
            token: TokenType.erc721,
            consumableType: consumableType,
            contractAddr: tokensERC721[0].address,
            amounts: [],
            tokenIds: [],
        };

        const outputERC721: Ingredient = {
            token: TokenType.erc721,
            consumableType: consumableType,
            contractAddr: tokensERC721[1].address,
            amounts: [],
            tokenIds,
        };

        const inputERC1155: Ingredient = {
            token: TokenType.erc1155,
            consumableType: consumableType,
            contractAddr: tokensERC1155[0].address,
            amounts: [10, 20],
            tokenIds: [1, 2],
        };

        const outputERC1155: Ingredient = {
            token: TokenType.erc1155,
            consumableType: consumableType,
            contractAddr: tokensERC1155[1].address,
            amounts: [10, 20],
            tokenIds: [1, 2],
        };

        // Pass back ingredients
        return {
            tokens: {
                inputERC20: tokensERC20[0],
                inputERC721: tokensERC721[0],
                inputERC1155: tokensERC1155[0],
                outputERC20: tokensERC20[1],
                outputERC721: tokensERC721[1],
                outputERC1155: tokensERC1155[1],
            },
            ingredients: { inputERC20, outputERC20, inputERC721, outputERC721, inputERC1155, outputERC1155 },
        };
    }

    async function authorizeTransfers(
        tokens: {
            erc20: FactoryERC20[];
            erc721: FactoryERC721[];
            erc1155: FactoryERC1155[];
        },
        crafterAddress: string,
        amountPerCraft = 10,
        crafts = 100,
    ) {
        // Await for all approvals
        await Promise.all([
            ...tokens.erc20.map((token) => token.connect(owner).approve(crafterAddress, amountPerCraft * crafts)),
            ...tokens.erc721.map((token) => token.connect(owner).setApprovalForAll(crafterAddress, true)),
            ...tokens.erc1155.map((token) => token.connect(owner).setApprovalForAll(crafterAddress, true)),
        ]);
    }

    describe('Crafter.initialize(...)', async () => {
        // it('Initialization with ingredients', async () => {
        //     // Unpack inputs/outputs
        //     const { tokens, ingredients } = await getIngredients();
        //     // Unpack ingredients
        //     const { inputERC20, outputERC20, inputERC721, outputERC721, inputERC1155, outputERC1155 } = ingredients;
        //     // Get Crafter (salt with nonce)
        //     const salt = ethers.utils.formatBytes32String(String(nonce));
        //     // Setup crafter data
        //     const CrafterTransferData = CrafterTransferImplementation.interface.encodeFunctionData('initialize', [
        //         owner.address,
        //         burnAddress.address,
        //         1,
        //         [inputERC20, inputERC721, inputERC1155],
        //         [outputERC20, outputERC721, outputERC1155],
        //     ]);
        //     // Predict address
        //     const CrafterTransferAddress = await ERC1167Factory.predictDeterministicAddress(
        //         CrafterTransferImplementation.address,
        //         salt,
        //         CrafterTransferData,
        //     );
        //     // Auth transfers
        //     await authorizeTransfers(
        //         {
        //             erc20: [tokens.inputERC20, tokens.outputERC20],
        //             erc721: [tokens.inputERC721, tokens.outputERC721],
        //             erc1155: [tokens.inputERC1155, tokens.outputERC1155],
        //         },
        //         CrafterTransferAddress,
        //     );
        //     // Clone deterministic
        //     const crafter = await ethers.getContractAt('CrafterTransfer', CrafterTransferAddress);
        //     await expect(
        //         ERC1167Factory.cloneDeterministic(CrafterTransferImplementation.address, salt, CrafterTransferData),
        //     ).to.emit(crafter, 'CreateRecipe');
        //     //Storage tests
        //     // Assert transferred
        //     expect(await tokens.outputERC20.balanceOf(crafter.address)).to.equal(10);
        //     expect(await tokens.outputERC721.ownerOf(1)).to.equal(crafter.address);
        //     expect(await tokens.outputERC1155.balanceOf(crafter.address, 1)).to.equal(10);
        //     expect(await tokens.outputERC1155.balanceOf(crafter.address, 2)).to.equal(20);
        // });
    });

    describe('Crafter.deposit(...) + Crafter.withdraw(...)', async () => {
        it('Deposit + Withdraw Ingredients', async () => {
            // Unpack inputs/outputs
            const { tokens, ingredients } = await getIngredients(ConsumableType.burned, 1);
            // Unpack ingredients
            const { inputERC20, outputERC20, inputERC721, outputERC721, inputERC1155, outputERC1155 } = ingredients;

            const salt = ethers.utils.formatBytes32String(String(nonce));

            const CrafterTransferData = CrafterTransferImplementation.interface.encodeFunctionData('initialize', [
                owner.address,
                burnAddress.address,
                1,
                [inputERC20, inputERC721, inputERC1155],
                [outputERC20, outputERC721, outputERC1155],
            ]);

            // Predict address
            const CrafterTransferAddress = await ERC1167Factory.predictDeterministicAddress(
                CrafterTransferImplementation.address,
                salt,
                CrafterTransferData,
            );

            // Auth transfers
            await authorizeTransfers(
                {
                    erc20: [tokens.inputERC20, tokens.outputERC20],
                    erc721: [tokens.inputERC721, tokens.outputERC721],
                    erc1155: [tokens.inputERC1155, tokens.outputERC1155],
                },
                CrafterTransferAddress,
            );

            // console.log('approvals?', await tokens.outputERC721(owner.address, CrafterTransferAddress));

            // Setup Crafter
            const crafter = await getCrafter(
                [inputERC20, inputERC721, inputERC1155],
                [outputERC20, outputERC721, outputERC1155],
            );
            console.log('asdasd', await crafter.getOutputs());
            console.log('deplyed to ', crafter.address, 'owner', owner.address);

            // Deposit + check token balances
            await expect(() => crafter.connect(owner).deposit(1, [[2]])).to.changeTokenBalance(
                tokens.outputERC20,
                crafter,
                10,
            );
            expect(await tokens.outputERC721.ownerOf(2)).to.equal(crafter.address);

            console.log('asd', await crafter.craftableAmount());
            // Withdraw + check token balances
            await expect(() => crafter.connect(owner).withdraw(1)).to.changeTokenBalance(tokens.outputERC20, owner, 10);
            console.log('asd', await crafter.craftableAmount());
            expect(await tokens.outputERC721.ownerOf(1)).to.equal(owner.address);
            expect(await tokens.outputERC1155.balanceOf(crafter.address, 1)).to.equal(0);
            // expect(await tokens.outputERC1155.balanceOf(crafter.address, 2)).to.equal(0);
        });
    });

    describe('Crafting.craft(...)', async () => {
        it('Standard Crafting', async () => {
            // Unpack inputs/outputs
            const { tokens, ingredients } = await getIngredients();
            // Unpack ingredients
            const { inputERC20, outputERC20, inputERC721, outputERC721, inputERC1155, outputERC1155 } = ingredients;
            // Setup Crafter
            const crafter = await getCrafter(
                [inputERC20, inputERC721, inputERC1155],
                [outputERC20, outputERC721, outputERC1155],
            );
            // Auth transfers
            await authorizeTransfers(
                {
                    erc20: [tokens.inputERC20, tokens.outputERC20],
                    erc721: [tokens.inputERC721, tokens.outputERC721],
                    erc1155: [tokens.inputERC1155, tokens.outputERC1155],
                },
                crafter.address,
            );

            // Make craftable
            await crafter.deposit(1, [[1]]);

            // Allowance
            await tokens.inputERC20.approve(crafter.address, 1000);

            // Craft
            await expect(crafter.craft(1, [[1]]))
                .to.emit(crafter, 'RecipeCraft')
                .withArgs(1, 0, owner.address);

            // Assert inputs transferred
            expect(await tokens.inputERC20.balanceOf(burnAddress.address)).to.equal(10);
            expect(await tokens.inputERC721.ownerOf(1)).to.equal(burnAddress.address);
            expect(await tokens.inputERC1155.balanceOf(burnAddress.address, 1)).to.equal(10);
            expect(await tokens.inputERC1155.balanceOf(burnAddress.address, 2)).to.equal(20);

            // Assert crafted elements
            expect(await tokens.outputERC20.balanceOf(crafter.address)).to.equal(0); // erc20 transferred
            expect(await tokens.outputERC721.ownerOf(1)).to.equal(owner.address); // erc721 transferred
            expect(await tokens.outputERC1155.balanceOf(crafter.address, 1)).to.equal(0);
            expect(await tokens.outputERC1155.balanceOf(crafter.address, 2)).to.equal(0);
        });

        it('Unconsumed Crafting', async () => {
            // Unpack inputs/outputs
            const { tokens, ingredients } = await getIngredients(ConsumableType.unaffected, 10);
            // Unpack ingredients
            const { inputERC20, outputERC20, inputERC721, outputERC721, inputERC1155, outputERC1155 } = ingredients;
            // Setup Crafter
            const crafter = await getCrafter(
                [inputERC20, inputERC721, inputERC1155],
                [outputERC20, outputERC721, outputERC1155],
            );
            // Auth transfers
            await authorizeTransfers(
                {
                    erc20: [tokens.inputERC20, tokens.outputERC20],
                    erc721: [tokens.inputERC721, tokens.outputERC721],
                    erc1155: [tokens.inputERC1155, tokens.outputERC1155],
                },
                crafter.address,
            );

            // Make craftable
            await crafter.deposit(1, [[1]]);

            // Allowance
            await tokens.inputERC20.approve(crafter.address, 1000);

            // Craft
            await expect(crafter.craft(1, [[1]]))
                .to.emit(crafter, 'RecipeCraft')
                .withArgs(1, 0, owner.address);

            // Assert inputs not transferred
            expect(await tokens.inputERC20.balanceOf(burnAddress.address)).to.equal(0);
            expect(await tokens.inputERC721.ownerOf(1)).to.equal(owner.address);
            expect(await tokens.inputERC1155.balanceOf(owner.address, 1)).to.equal(100);
            expect(await tokens.inputERC1155.balanceOf(owner.address, 2)).to.equal(100);
        });
    });
});
