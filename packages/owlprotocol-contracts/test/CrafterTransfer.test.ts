import { ethers } from 'hardhat';
import { expect } from 'chai';
import { SignerWithAddress } from '@nomiclabs/hardhat-ethers/signers';
import { CrafterTransfer, CrafterTransfer__factory, FactoryERC20, FactoryERC721 } from '../typechain';
import { createERC20 } from './Helpers/FactoryERC20.test';
import { createERC721 } from './Helpers/FactoryERC721.test';
import { BigNumberish } from 'ethers';

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
    let user: SignerWithAddress;
    let burnAddress: SignerWithAddress;

    let CrafterTransferFactory: CrafterTransfer__factory;

    before(async () => {
        CrafterTransferFactory = await ethers.getContractFactory('CrafterTransfer');
        [owner, user, burnAddress] = await ethers.getSigners();
    });

    async function getCrafter(inputs: Ingredient[], outputs: Ingredient[]) {
        // Get Crafter
        const crafter = await CrafterTransferFactory.deploy();
        await crafter.initialize(burnAddress.address, 0, [...inputs], [...outputs], []);

        return crafter;
    }

    async function getIngredients(consumableType = ConsumableType.burned) {
        const tokensERC20 = await createERC20(2);
        const tokensERC721 = await createERC721(2);
        // const [inputERC1155, outputERC1155] = await createERC1155(2);
        // TODO - ERC1155
        const IngredientsERC20: Ingredient[] = tokensERC20.map((token) => ({
            token: TokenType.erc20,
            consumableType: consumableType,
            contractAddr: token.address,
            amounts: [10],
            tokenIds: [],
        }));
        const IngredientsERC721: Ingredient[] = tokensERC721.map((token) => ({
            token: TokenType.erc721,
            consumableType: consumableType,
            contractAddr: token.address,
            amounts: [],
            tokenIds: [],
        }));
        // Pass back ingredients
        return {
            tokens: { erc20: tokensERC20, erc721: tokensERC721 },
            ingredients: [IngredientsERC20, IngredientsERC721],
        };
    }

    async function authorizeTransfers(
        tokens: {
            erc20: FactoryERC20[];
            erc721: FactoryERC721[];
        },
        crafter: CrafterTransfer,
        amountPerCraft = 10,
        crafts = 1,
    ) {
        // Await for all approvals
        await Promise.all([
            ...tokens.erc20.map((token) => token.approve(crafter.address, amountPerCraft * crafts)),
            ...tokens.erc721.map((token) => token.setApprovalForAll(crafter.address, true)),
        ]);
    }

    describe('Crafter.initialize(...)', async () => {
        it('Normal Initialization', async () => {
            // Unpack inputs/outputs
            const { tokens, ingredients } = await getIngredients();
            // Unpack ingredients
            const [[inputERC20, outputERC20], [inputERC721, outputERC721]] = ingredients;
            const crafter = await CrafterTransferFactory.deploy();
            await expect(
                crafter.initialize(burnAddress.address, 0, [inputERC20, inputERC721], [outputERC20, outputERC721], []),
            ).to.emit(crafter, 'CreateRecipe');
        });
    });

    describe('Crafter.deposit(...) + Crafter.withdraw(...)', async () => {
        it('Deposit + Withdraw Ingredients', async () => {
            // Unpack inputs/outputs
            const { tokens, ingredients } = await getIngredients();
            // Unpack ingredients
            const [[inputERC20, outputERC20], [inputERC721, outputERC721]] = ingredients;
            // Setup Crafter
            const crafter = await getCrafter([inputERC20, inputERC721], [outputERC20, outputERC721]);
            // Auth transfers
            await authorizeTransfers(tokens, crafter);

            // Deposit + check token balances
            await expect(() => crafter.deposit(1, [[1]])).to.changeTokenBalance(tokens.erc20[1], crafter, 10);
            expect(await tokens.erc721[1].ownerOf(1)).to.equal(crafter.address);

            // Withdraw + check token balances
            await expect(() => crafter.withdraw(1)).to.changeTokenBalance(tokens.erc20[1], owner, 10);
            expect(await tokens.erc721[1].ownerOf(1)).to.equal(owner.address);
        });
    });

    describe('Crafting.craft(...)', async () => {
        it('Standard Crafting', async () => {
            // Unpack inputs/outputs
            const { tokens, ingredients } = await getIngredients();
            // Unpack ingredients
            const [[inputERC20, outputERC20], [inputERC721, outputERC721]] = ingredients;
            // Setup Crafter
            const crafter = await getCrafter([inputERC20, inputERC721], [outputERC20, outputERC721]);
            // Auth transfers
            await authorizeTransfers(tokens, crafter);

            // Make craftable
            await crafter.deposit(1, [[1]]);

            // Allowance
            await tokens.erc20[0].approve(crafter.address, 1000);

            // Craft
            await expect(crafter.craft(1, [[1]]))
                .to.emit(crafter, 'RecipeCraft')
                .withArgs(1, 0, owner.address);

            // Assert inputs transferred
            expect(await tokens.erc20[0].balanceOf(burnAddress.address)).to.equal(10);
            expect(await tokens.erc721[0].ownerOf(1)).to.equal(burnAddress.address);

            // Assert crafted elements
            expect(await tokens.erc20[1].balanceOf(crafter.address)).to.equal(0); // erc20 transferred
            expect(await tokens.erc721[1].ownerOf(1)).to.equal(owner.address); // erc721 transferred
        });

        it('Unconsumed Crafting', async () => {
            // Unpack inputs/outputs
            const { tokens, ingredients } = await getIngredients(ConsumableType.unaffected);
            // Unpack ingredients
            const [[inputERC20, outputERC20], [inputERC721, outputERC721]] = ingredients;
            // Setup Crafter
            const crafter = await getCrafter([inputERC20, inputERC721], [outputERC20, outputERC721]);
            // Auth transfers
            await authorizeTransfers(tokens, crafter);

            // Make craftable
            await crafter.deposit(1, [[1]]);

            // Allowance
            await tokens.erc20[0].approve(crafter.address, 1000);

            // Craft
            await expect(crafter.craft(1, [[1]]))
                .to.emit(crafter, 'RecipeCraft')
                .withArgs(1, 0, owner.address);

            // Assert inputs not transferred
            expect(await tokens.erc20[0].balanceOf(burnAddress.address)).to.equal(0);
            expect(await tokens.erc721[0].ownerOf(1)).to.equal(owner.address);
        });
    });
});
