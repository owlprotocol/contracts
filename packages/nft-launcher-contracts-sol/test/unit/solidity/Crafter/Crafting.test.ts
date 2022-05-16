import { expect, assert } from 'chai';
import { InputERC20, InputERC721, OutputERC20, OutputERC721 } from '../../../../src/nft-launcher-lib/Crafter';
import { createERC20 } from '../FactoryERC20.test';
import { createERC721 } from '../FactoryERC721.test';
import { Crafter__factory } from '../../../../typechain';
import { SignerWithAddress } from '@nomiclabs/hardhat-ethers/signers';

export default function (
    NFTCrafter: Crafter__factory,
    owner: SignerWithAddress,
    user: SignerWithAddress,
    burnAddress: SignerWithAddress,
) {
    describe('Crafter.craftForRecipe(...)', async () => {
        it('ERC20 -> ERC20', async () => {
            // Create contract object
            const nftcrafter = await NFTCrafter.deploy();
            const [input1, input2, output1, output2] = await createERC20(4);
            const recipeId = 1;
            const craftAmount = 1;
            await Promise.all([nftcrafter, input1, input2, output1, output2].map((c) => c.deployed()));

            // Recipe data
            const inputsERC20: Array<InputERC20> = [
                {
                    contractAddr: input1.address,
                    consumableType: 0,
                    amount: '1',
                },
                {
                    contractAddr: input2.address,
                    consumableType: 1,
                    amount: '2',
                },
            ];
            const outputsERC20: Array<OutputERC20> = [
                {
                    contractAddr: output1.address,
                    amount: '1',
                },
                {
                    contractAddr: output2.address,
                    amount: '2',
                },
            ];

            // Create Recipe
            await nftcrafter.createRecipe(inputsERC20, [], outputsERC20, []);

            // Set approvals for transfers
            await output1.increaseAllowance(nftcrafter.address, '1');
            await output2.increaseAllowance(nftcrafter.address, '2');

            // Attempt to deposit
            await nftcrafter.depositForRecipe(recipeId, craftAmount, []);

            // Give resources / set approvals for crafting
            await input1.transfer(user.address, '1');
            await input2.transfer(user.address, '2');
            // ConsumableType: Unaffected -> await input1.increaseAllowance(nftcrafter.address, '1')
            await input2.connect(user).increaseAllowance(nftcrafter.address, '2');

            // Call craft
            await expect(nftcrafter.connect(user).craftForRecipe(recipeId, []))
                .to.emit(nftcrafter, 'RecipeCraft')
                .withArgs(1, 1, 0, user.address);

            // Assert transfers
            assert((await input1.balanceOf(user.address)).eq(1), 'input1 token bal !=1'); // consumableType: unaffected
            assert((await input2.balanceOf(user.address)).eq(0), 'input2 token bal != 0');
            assert((await output1.balanceOf(user.address)).eq(1), 'output1 token bal != 1');
            assert((await output2.balanceOf(user.address)).eq(2), 'output2 token bal != 2');

            // No ingredients left
            await expect(nftcrafter.connect(user).craftForRecipe(recipeId, [])).to.be.revertedWith(
                'Not enough resources left for crafting!',
            );
        });

        it('ERC721 -> ERC721', async () => {
            // Create contract object
            const nftcrafter = await NFTCrafter.deploy();
            const [input1, input2, output1, output2] = await createERC721(4, 0); // create 4 tokens, mint 0 nfts
            const recipeId = 1;
            const craftAmount = 1;
            await Promise.all([nftcrafter, input1, input2, output1, output2].map((c) => c.deployed()));

            // Recipe data
            const inputsERC721: Array<InputERC721> = [
                {
                    contractAddr: input1.address,
                    consumableType: 0,
                },
                {
                    contractAddr: input2.address,
                    consumableType: 1,
                },
            ];
            const outputsERC721: Array<OutputERC721> = [
                {
                    contractAddr: output1.address,
                    ids: [],
                },
                {
                    contractAddr: output2.address,
                    ids: [],
                },
            ];

            // Create Recipe
            await nftcrafter.createRecipe([], inputsERC721, [], outputsERC721);

            // Create/Set approvals for transfers
            await output1.mintTokens(1);
            await output2.mintTokens(1);
            await output1.setApprovalForAll(nftcrafter.address, true);
            await output2.setApprovalForAll(nftcrafter.address, true);

            // Attempt to deposit
            await nftcrafter.depositForRecipe(recipeId, craftAmount, [['1'], ['1']]);

            // Give resources / set approvals for crafting
            await input1.connect(user).mintTokens(1);
            await input2.connect(user).mintTokens(1);
            // ConsumableType: Unaffected -> await input1.increaseAllowance(nftcrafter.address, '1')
            await input2.connect(user).setApprovalForAll(nftcrafter.address, true);

            // Craft where user doesn't own ids
            await input1.mintTokens(1);
            await input2.mintTokens(1);
            await expect(nftcrafter.connect(user).craftForRecipe(recipeId, ['2', '2'])).to.be.revertedWith(
                'User does not own token(s)!',
            );

            // Call craft
            await expect(nftcrafter.connect(user).craftForRecipe(recipeId, ['1', '1']))
                .to.emit(nftcrafter, 'RecipeCraft')
                .withArgs(1, 1, 0, user.address);

            // Assert transfers
            assert.equal(await input1.ownerOf('1'), user.address, 'input1 token transferred (not unaffected)!'); // consumableType: unaffected
            assert.equal(await input2.ownerOf('1'), nftcrafter.address, 'input2 token not transferred!');
            assert.equal(await output1.ownerOf('1'), user.address, 'output1 token not transferred!');
            assert.equal(await output2.ownerOf('1'), user.address, 'output2 token not transferred!');

            // No ingredients left
            await expect(nftcrafter.connect(user).craftForRecipe(recipeId, [])).to.be.revertedWith(
                'Not enough resources left for crafting!',
            );
        });

        it('ERC20 + ERC721 -> ERC20 + ERC721', async () => {
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

            // Create Recipe
            await nftcrafter.createRecipe(inputsERC20, inputsERC721, outputsERC20, outputsERC721);

            // ERC20 transfers
            await outputToken1.increaseAllowance(nftcrafter.address, '1');
            await outputToken2.increaseAllowance(nftcrafter.address, '2');

            // Create/Set approvals for transfers
            await outputNFT1.mintTokens(1);
            await outputNFT2.mintTokens(1);
            await outputNFT1.setApprovalForAll(nftcrafter.address, true);
            await outputNFT2.setApprovalForAll(nftcrafter.address, true);

            // Attempt to deposit
            await nftcrafter.depositForRecipe(recipeId, craftAmount, [['1'], ['1']]);

            // Give NFT resources / set approvals for crafting
            await inputNFT1.connect(user).mintTokens(1);
            await inputNFT2.connect(user).mintTokens(1);
            // ConsumableType: Unaffected -> await input1.setApprovalForAll(nftcrafter.address, true, { from: user })
            await inputNFT2.connect(user).setApprovalForAll(nftcrafter.address, true);

            // Give ERC20 resources / set approvals for crafting
            await inputToken1.transfer(user.address, '1');
            await inputToken2.transfer(user.address, '2');
            // ConsumableType: Unaffected -> await inputToken1.increaseAllowance(nftcrafter.address, '1')
            await inputToken2.connect(user).increaseAllowance(nftcrafter.address, '2');

            // Call craft
            await expect(nftcrafter.connect(user).craftForRecipe(recipeId, ['1', '1']))
                .to.emit(nftcrafter, 'RecipeCraft')
                .withArgs(1, 1, 0, user.address);

            // Assert transfers
            assert.equal(await inputNFT1.ownerOf('1'), user.address, 'input1 NFT transferred (not unaffected)!'); // consumableType: unaffected
            assert.equal(await inputNFT2.ownerOf('1'), nftcrafter.address, 'input2 NFT not transferred!');
            assert.equal(await outputNFT1.ownerOf('1'), user.address, 'output1 NFT not transferred!');
            assert.equal(await outputNFT2.ownerOf('1'), user.address, 'output2 NFT not transferred!');

            // Assert transfers
            assert((await inputToken1.balanceOf(user.address)).eq(1), 'input1 token bal !=1'); // consumableType: unaffected
            assert((await inputToken2.balanceOf(user.address)).eq(0), 'input2 token bal != 0');
            assert((await outputToken1.balanceOf(user.address)).eq(1), 'output1 token bal != 1');
            assert((await outputToken2.balanceOf(user.address)).eq(2), 'output2 token bal != 2');

            // No ingredients left
            await expect(nftcrafter.connect(user).craftForRecipe(recipeId, [])).to.be.revertedWith(
                'Not enough resources left for crafting!',
            );
        });

        it.only('ERC20 + ERC721 Burn Address', async () => {
            // Create contract object
            const nftcrafter = await NFTCrafter.deploy();
            const [inputNFT1, inputNFT2] = await createERC721(4, 0); // create 4 tokens, mint 0 nfts
            const [inputToken1, inputToken2, outputToken1] = await createERC20(4);
            const recipeId = 1;
            const craftAmount = 1;
            await Promise.all(
                [nftcrafter, inputNFT1, inputNFT2, inputToken1, inputToken2, outputToken1].map((c) => c.deployed()),
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
            ];

            // Create Recipe
            await nftcrafter.createRecipe(inputsERC20, inputsERC721, outputsERC20, []);

            // ERC20 transfers
            await outputToken1.increaseAllowance(nftcrafter.address, '1');

            // Attempt to deposit
            await nftcrafter.depositForRecipe(recipeId, craftAmount, []);

            // Give NFT resources / set approvals for crafting
            await inputNFT1.connect(user).mintTokens(1);
            await inputNFT2.connect(user).mintTokens(1);
            // ConsumableType: Unaffected -> await input1.setApprovalForAll(nftcrafter.address, true, { from: user })
            await inputNFT2.connect(user).setApprovalForAll(nftcrafter.address, true);

            // Give ERC20 resources / set approvals for crafting
            await inputToken1.transfer(user.address, '1');
            await inputToken2.transfer(user.address, '2');
            // ConsumableType: Unaffected -> await inputToken1.increaseAllowance(nftcrafter.address, '1')
            await inputToken2.connect(user).increaseAllowance(nftcrafter.address, '2');

            // Set burn addr
            await nftcrafter.setBurnAddress(recipeId, burnAddress.address);

            // Call craft
            await expect(() => nftcrafter.connect(user).craftForRecipe(recipeId, ['1', '1'])).to.changeTokenBalance(
                inputToken2,
                burnAddress,
                2,
            );

            // Assert transfers
            assert.equal(await inputNFT2.ownerOf('1'), burnAddress.address, 'input2 NFT not transferred!');

            // Assert transfers
            assert((await inputToken2.balanceOf(burnAddress.address)).eq(2), 'input2 token bal != 0');
        });
    });
}
