import { expect, assert } from 'chai';
import { InputERC20, OutputERC20, OutputERC721 } from '../../../../src/nft-launcher-lib/Crafter';
import { createERC20 } from '../FactoryERC20.test';
import { createERC721 } from '../FactoryERC721.test';
import { Crafter__factory } from '../../../../typechain';
import { SignerWithAddress } from '@nomiclabs/hardhat-ethers/signers';

// eslint-disable-next-line @typescript-eslint/no-unused-vars
export default function (NFTCrafter: Crafter__factory, owner: SignerWithAddress, user: SignerWithAddress) {
    describe('Crafter.depositForRecipe(...) + Crafter.withdrawForRecipe(...)', async () => {
        it('ERC20 outputs', async () => {
            // Create contract object
            const nftcrafter = await NFTCrafter.deploy();
            const [token1, token2] = await createERC20(2);
            await Promise.all([nftcrafter, token1, token2].map((c) => c.deployed()));

            const recipeId = 1;
            const craftAmount = 3;
            const withdrawCraftAmount = 2;

            // Recipe data
            const inputsERC20: Array<InputERC20> = [
                {
                    contractAddr: '0x0000000000000000000000000000000000000001',
                    consumableType: 1,
                    amount: '1',
                },
            ];
            const outputsERC20: Array<OutputERC20> = [
                {
                    contractAddr: token1.address,
                    amount: '2',
                },
                {
                    contractAddr: token2.address,
                    amount: '3',
                },
            ];

            // Create Recipe
            await nftcrafter.createRecipe(inputsERC20, [], outputsERC20, []);

            // Set approvals for transfers
            await token1.increaseAllowance(nftcrafter.address, '6');
            await token2.increaseAllowance(nftcrafter.address, '9');

            // Attempt to deposit
            await expect(nftcrafter.depositForRecipe(recipeId, craftAmount, []))
                .to.emit(nftcrafter, 'RecipeUpdate')
                .withArgs(recipeId, craftAmount);

            // Get recipe
            let recipe = await nftcrafter.getRecipe(1);
            assert.isTrue(recipe.craftableAmount.eq(3), 'Resources not added correctly');

            // Confirm transfers
            assert((await token1.balanceOf(nftcrafter.address)).eq(6), 'token1 not transferred!');
            assert((await token2.balanceOf(nftcrafter.address)).eq(9), 'token2 not transferred!');

            // Withdraw out
            await expect(nftcrafter.withdrawForRecipe(recipeId, withdrawCraftAmount))
                .to.emit(nftcrafter, 'RecipeUpdate')
                .withArgs(recipeId, craftAmount - withdrawCraftAmount);

            // Get recipe
            recipe = await nftcrafter.getRecipe(1);
            assert.isTrue(
                recipe.craftableAmount.eq(craftAmount - withdrawCraftAmount),
                'Resources not withdrawn correctly',
            );

            // Confirm transfers
            assert((await token1.balanceOf(nftcrafter.address)).eq(2), 'token1 not withdrawn!');
            assert((await token2.balanceOf(nftcrafter.address)).eq(3), 'token2 not withdrawn!');
        });

        it('ERC721 outputs', async () => {
            // Create contract object
            const nftcrafter = await NFTCrafter.deploy();
            const [token1, token2] = await createERC721(2);
            const recipeId = 1;
            const craftAmount = 3;
            const withdrawCraftAmount = 2;
            await Promise.all([nftcrafter, token1, token2].map((c) => c.deployed()));

            const inputsERC20: Array<InputERC20> = [
                {
                    contractAddr: '0x0000000000000000000000000000000000000001',
                    consumableType: 1,
                    amount: '1',
                },
            ];
            const outputsERC721: Array<OutputERC721> = [
                {
                    contractAddr: token1.address,
                    ids: [],
                },
                {
                    contractAddr: token2.address,
                    ids: [],
                },
            ];

            // Create Recipe
            await nftcrafter.createRecipe(inputsERC20, [], [], outputsERC721);

            // Set approvals for NFT transfers
            await token1.setApprovalForAll(nftcrafter.address, true);
            await token2.setApprovalForAll(nftcrafter.address, true);

            // Run transfers
            // Attempt to deposit
            await nftcrafter.depositForRecipe(recipeId, craftAmount, [
                ['1', '2', '3'],
                ['4', '5', '6'],
            ]);

            // Get recipe
            let recipe = await nftcrafter.getRecipe(1);
            assert.isTrue(recipe.craftableAmount.eq(3), 'Resources not added correctly');

            // Confirm successful transfer
            assert.equal(await token1.ownerOf(1), nftcrafter.address, 'Token1 transfer unsuccessful');
            assert.equal(await token2.ownerOf(4), nftcrafter.address, 'Token2 transfer unsuccessful');

            // Withdraw out
            await nftcrafter.withdrawForRecipe(recipeId, withdrawCraftAmount);

            // Get recipe
            recipe = await nftcrafter.getRecipe(1);
            assert.isTrue(
                recipe.craftableAmount.eq(craftAmount - withdrawCraftAmount),
                'Resources not withdrawn correctly',
            );

            // Confirm transfers
            assert.equal(await token1.ownerOf(1), nftcrafter.address, 'Token1 [1] withdraw unsuccessful');
            assert.equal(await token2.ownerOf(4), nftcrafter.address, 'Token2 [4] withdraw unsuccessful');

            assert.equal(await token1.ownerOf(2), owner.address, 'Token1 [2] withdraw unsuccessful');
            assert.equal(await token1.ownerOf(3), owner.address, 'Token1 [3] withdraw unsuccessful');
            assert.equal(await token1.ownerOf(5), owner.address, 'Token2 [5] withdraw unsuccessful');
            assert.equal(await token1.ownerOf(6), owner.address, 'Token3 [6] withdraw unsuccessful');
        });

        it('ERC20 + ERC721', async () => {
            // Create contract object
            const nftcrafter = await NFTCrafter.deploy();

            const [nft1, nft2] = await createERC721(2);
            const [token1, token2] = await createERC20(2);

            await Promise.all([nftcrafter, token1, token2, nft1, nft2].map((c) => c.deployed()));

            const recipeId = 1;
            const craftAmount = 3;
            const withdrawCraftAmount = 2;

            // Recipe data
            const inputsERC20: Array<InputERC20> = [
                {
                    contractAddr: '0x0000000000000000000000000000000000000001',
                    consumableType: 1,
                    amount: '1',
                },
            ];
            const outputsERC20: Array<OutputERC20> = [
                {
                    contractAddr: token1.address,
                    amount: '2',
                },
                {
                    contractAddr: token2.address,
                    amount: '3',
                },
            ];
            const outputsERC721: Array<OutputERC721> = [
                {
                    contractAddr: nft1.address,
                    ids: [],
                },
                {
                    contractAddr: nft2.address,
                    ids: [],
                },
            ];

            // Create Recipe
            await nftcrafter.createRecipe(inputsERC20, [], outputsERC20, outputsERC721);

            // Set approvals for NFT transfers
            await nft1.setApprovalForAll(nftcrafter.address, true);
            await nft2.setApprovalForAll(nftcrafter.address, true);

            // Set approvals for transfers
            await token1.increaseAllowance(nftcrafter.address, '6');
            await token2.increaseAllowance(nftcrafter.address, '9');

            // Run transfers
            // Attempt to deposit
            await nftcrafter.depositForRecipe(recipeId, craftAmount, [
                ['1', '2', '3'],
                ['4', '5', '6'],
            ]);

            // Get recipe
            let recipe = await nftcrafter.getRecipe(1);
            assert.isTrue(recipe.craftableAmount.eq(3), 'Resources not added correctly');

            // Confirm nft transfer
            assert.equal(await nft1.ownerOf(1), nftcrafter.address, 'Token1 transfer unsuccessful');
            assert.equal(await nft2.ownerOf(4), nftcrafter.address, 'Token2 transfer unsuccessful');

            // Confirm token transfers
            assert((await token1.balanceOf(nftcrafter.address)).eq(6), 'token1 not transferred!');
            assert((await token2.balanceOf(nftcrafter.address)).eq(9), 'token2 not transferred!');

            // Withdraw out
            await nftcrafter.withdrawForRecipe(recipeId, withdrawCraftAmount);

            // Get recipe
            recipe = await nftcrafter.getRecipe(1);
            assert.isTrue(
                recipe.craftableAmount.eq(craftAmount - withdrawCraftAmount),
                'Resources not withdrawn correctly',
            );

            // Confirm nft transfers
            assert.equal(await nft1.ownerOf(1), nftcrafter.address, 'Token1 [1] withdraw unsuccessful');
            assert.equal(await nft2.ownerOf(4), nftcrafter.address, 'Token2 [4] withdraw unsuccessful');

            assert.equal(await nft1.ownerOf(2), owner.address, 'Token1 [2] withdraw unsuccessful');
            assert.equal(await nft1.ownerOf(3), owner.address, 'Token1 [3] withdraw unsuccessful');
            assert.equal(await nft1.ownerOf(5), owner.address, 'Token2 [5] withdraw unsuccessful');
            assert.equal(await nft1.ownerOf(6), owner.address, 'Token3 [6] withdraw unsuccessful');

            // Confirm erc20 transfers
            assert((await token1.balanceOf(nftcrafter.address)).eq(2), 'token1 not withdrawn!');
            assert((await token2.balanceOf(nftcrafter.address)).eq(3), 'token2 not withdrawn!');
        });
    });
}
