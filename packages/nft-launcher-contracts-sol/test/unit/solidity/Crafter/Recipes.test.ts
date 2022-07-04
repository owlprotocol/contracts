import { expect, assert } from 'chai';
import { InputERC20, InputERC721, OutputERC20, OutputERC721 } from '../../../../src/nft-launcher-lib/Crafter';
import { createERC20 } from '../FactoryERC20.test';
import { createERC721 } from '../FactoryERC721.test';
import { Crafter__factory } from '../../../../typechain';
import { SignerWithAddress } from '@nomiclabs/hardhat-ethers/signers';

export default function (NFTCrafter: Crafter__factory, owner: SignerWithAddress, user: SignerWithAddress) {
    describe('Crafter.createRecipe(...)', async () => {
        it('Recipe input/output creation requirements', async () => {
            // Contract
            const nftcrafter = await NFTCrafter.deploy();
            await nftcrafter.deployed();

            // Test no inputs
            const inputsERC721: Array<InputERC721> = [
                {
                    contractAddr: '0x0000000000000000000000000000000000000011',
                    consumableType: 0,
                },
            ];
            const outputsERC20: Array<OutputERC20> = [
                {
                    contractAddr: '0x0000000000000000000000000000000000000020',
                    amount: '2',
                },
            ];

            // No inputs / outputs
            await expect(nftcrafter.createRecipe([], [], [], [])).to.be.revertedWith('A crafting input must be given!');

            // No outputs
            await expect(nftcrafter.createRecipe([], inputsERC721, [], [])).to.be.revertedWith(
                'A crafting output must be given!',
            );

            // Correct call
            await nftcrafter.createRecipe([], inputsERC721, outputsERC20, []);
        });
    });

    describe('Crafter.depositForRecipe(...)', async () => {
        it.skip('depositForRecipe invalid ERC721 array', async () => {
            // Create contract object
            const nftcrafter = await NFTCrafter.deploy();
            await nftcrafter.deployed();

            const [token1, token2] = await createERC721(2);
            const recipeId = 1;
            const craftAmount = 3;

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
            // TODO - see why this isn't failing
            // Attempt to deposit (fails because of misshaped array)
            // await expect(
            //     nftcrafter.depositForRecipe(recipeId, craftAmount, [
            //         ['1', '2', '3'],
            //         ['4', '5'],
            //     ]),
            // ).to.be.revertedWith('abc');

            // Misshaped Array 2 (too many outputs)
            await expect(
                nftcrafter.depositForRecipe(recipeId, craftAmount, [
                    ['1', '2', '3'],
                    ['4', '5', '6'],
                    ['7', '8', '9'],
                ]),
            ).to.be.revertedWith('Missing ERC721 output item(s)');
        });

        it('onlyRecipeCreator permission test', async () => {
            // Create contract object
            const nftcrafter = await NFTCrafter.deploy();
            await nftcrafter.deployed();

            const [token1] = await createERC721(1);
            const recipeId = 1;
            const craftAmount = 3;

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
            ];

            // Create Recipe
            await nftcrafter.createRecipe(inputsERC20, [], [], outputsERC721);

            // Set approvals for NFT transfers
            await token1.setApprovalForAll(nftcrafter.address, true);

            // Run transfers
            // Attempt to deposit (fails because `onlyRecipeCreator`)
            await expect(
                nftcrafter.connect(user).depositForRecipe(recipeId, craftAmount, [['1', '2', '3']]),
            ).to.be.revertedWith('Only recipe owners can call this!');

            await nftcrafter.connect(owner).depositForRecipe(recipeId, craftAmount, [['1', '2', '3']]);
        });

        it('invalid withdrawAmount test', async () => {
            // Create contract object
            const nftcrafter = await NFTCrafter.deploy();
            await nftcrafter.deployed();

            const [token1] = await createERC721(1);
            const recipeId = 1;
            const craftAmount = 3;
            const withdrawAmount = 5;

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
            ];

            // Create Recipe
            await nftcrafter.createRecipe(inputsERC20, [], [], outputsERC721);

            // Set approvals for NFT transfers
            await token1.setApprovalForAll(nftcrafter.address, true);

            // Run transfers
            await nftcrafter.depositForRecipe(recipeId, craftAmount, [['1', '2', '3']]);

            // Withdraw fails (withdrawAmount > craftableAmount)
            await expect(nftcrafter.withdrawForRecipe(recipeId, withdrawAmount)).to.be.revertedWith(
                'Not enough resources to withdraw!',
            );

            // Withdraw fails (withdrawAmount == 0)
            await expect(nftcrafter.withdrawForRecipe(recipeId, 0)).to.be.revertedWith(
                'withdrawCraftAmount cannot be 0!',
            );

            // Withdraw success (withdrawAmount == craftableAmount)
            await nftcrafter.withdrawForRecipe(recipeId, craftAmount);
        });
    });

    describe('Crafter.createRecipeWithDeposit(...)', async () => {
        it('Create recipe with deposit', async () => {
            // Create contract object
            const nftcrafter = await NFTCrafter.deploy();
            const [inputNFT1, inputNFT2, outputNFT1, outputNFT2] = await createERC721(4, 0); // create 4 tokens, mint 0 nfts
            const [inputToken1, inputToken2, outputToken1, outputToken2] = await createERC20(4);
            const recipeId = 1;
            const craftAmount = 1;

            await Promise.all(
                [
                    nftcrafter,
                    inputNFT1,
                    inputNFT2,
                    outputNFT1,
                    outputNFT2,
                    inputToken1,
                    inputToken2,
                    outputToken1,
                    outputToken2,
                ].map((c) => c.deployed()),
            );

            // Recipe data
            const inputsERC20: Array<InputERC20> = [
                {
                    contractAddr: inputToken1.address,
                    consumableType: 0,
                    amount: '1',
                },
                {
                    contractAddr: inputToken2.address,
                    consumableType: 1,
                    amount: '2',
                },
            ];
            const inputsERC721: Array<InputERC721> = [
                {
                    contractAddr: inputNFT1.address,
                    consumableType: 0,
                },
                {
                    contractAddr: inputNFT2.address,
                    consumableType: 1,
                },
            ];
            const outputsERC20: Array<OutputERC20> = [
                {
                    contractAddr: outputToken1.address,
                    amount: '1',
                },
                {
                    contractAddr: outputToken2.address,
                    amount: '2',
                },
            ];
            const outputsERC721: Array<OutputERC721> = [
                {
                    contractAddr: outputNFT1.address,
                    ids: [],
                },
                {
                    contractAddr: outputNFT2.address,
                    ids: [],
                },
            ];

            // ERC20 transfers
            await outputToken1.increaseAllowance(nftcrafter.address, '1');
            await outputToken2.increaseAllowance(nftcrafter.address, '2');

            // Create/Set approvals for transfers
            await outputNFT1.mintTokens(1);
            await outputNFT2.mintTokens(1);
            await outputNFT1.setApprovalForAll(nftcrafter.address, true);
            await outputNFT2.setApprovalForAll(nftcrafter.address, true);

            // CreateRecipeWithDespot
            await nftcrafter.createRecipeWithDeposit(
                inputsERC20,
                inputsERC721,
                outputsERC20,
                outputsERC721,
                craftAmount,
                [['1'], ['1']],
            );

            // Create with no craftableAmount
            await expect(
                nftcrafter.createRecipeWithDeposit(inputsERC20, inputsERC721, outputsERC20, outputsERC721, 0, []),
            ).to.be.revertedWith('`craftAmount` must be larger than 0!');

            const recipe = await nftcrafter.getRecipe(1);
            assert.isTrue(recipe.craftableAmount.eq(recipeId), 'craftableAmount not updated!');

            // Try deposting (test recipe owner)
            await outputToken1.increaseAllowance(nftcrafter.address, '1');
            await outputToken2.increaseAllowance(nftcrafter.address, '2');
            await outputNFT1.mintTokens(1);
            await outputNFT2.mintTokens(1);

            await nftcrafter.depositForRecipe(recipeId, craftAmount, [['2'], ['2']]);

            // Try deposting (not owner)
            await expect(
                nftcrafter.connect(user).depositForRecipe(recipeId, craftAmount, [['2'], ['2']]),
            ).to.be.revertedWith('Only recipe owners can call this!');
        });
    });
}
