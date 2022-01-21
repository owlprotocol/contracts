import chai from 'chai';
import chaiAsPromised from 'chai-as-promised';
import configureGanache from '../../utils/configureGanache';
import setProvider from '../../utils/setProvider';
import NFTCrafterTruffle from '../../truffle/NFTCrafter';
import FactoryERC20Truffle from '../../truffle/FactoryERC20';
import FactoryERC721Truffle from '../../truffle/FactoryERC721';

import { InputERC20, InputERC721, OutputERC20, OutputERC721, parseRecipe } from '../../nft-crafter-lib/recipe';
import { createERC20 } from './FactoryERC20.test';
import { createERC721 } from './FactoryERC721.test';

chai.use(chaiAsPromised);
const { assert, expect } = chai;

describe('NFTCrafter', function () {
    let accounts: string[];
    let owner: string;
    let user: string;

    before(async () => {
        const config = await configureGanache();
        ({ accounts } = config);
        setProvider([NFTCrafterTruffle], config.provider, accounts[0]);
        setProvider([FactoryERC20Truffle], config.provider, accounts[0]);
        setProvider([FactoryERC721Truffle], config.provider, accounts[0]);

        owner = accounts[0];
        user = accounts[1];
    });

    it('Create / Read Recipes', async () => {
        // Create contract object
        const nftcrafter = await NFTCrafterTruffle.new();

        // Recipe data
        const inputsERC20: Array<InputERC20> = [
            {
                contractAddr: '0x0000000000000000000000000000000000000001',
                consumableType: 1,
                amount: '1',
            },
            {
                contractAddr: '0x0000000000000000000000000000000000000002',
                consumableType: 0,
                amount: '2',
            },
        ];
        const inputsERC721: Array<InputERC721> = [
            {
                contractAddr: '0x0000000000000000000000000000000000000011',
                consumableType: 0,
                amount: '2',
            },
        ];
        const outputsERC20: Array<OutputERC20> = [
            {
                contractAddr: '0x0000000000000000000000000000000000000020',
                amount: '2',
            },
        ];
        const outputsERC721: Array<OutputERC721> = [
            {
                contractAddr: '0x0000000000000000000000000000000000000030',
                ids: [],
            },
        ];

        // Create Recipe
        await nftcrafter.createRecipe(inputsERC20, inputsERC721, outputsERC20, outputsERC721);

        // Events testing
        const recipeEvent = await nftcrafter.getPastEvents('CreateRecipe');
        assert.equal(recipeEvent[0].returnValues.recipeId, 1, 'RecipeID Event Created');

        // Get Recipe
        const recipe = parseRecipe(await nftcrafter.getRecipe(1));

        // Check ERC20 Inputs
        assert.equal(
            recipe.inputsERC20[0].contractAddr,
            inputsERC20[0].contractAddr,
            'Input ERC20 contract addresses mismatch!',
        );
        assert.equal(
            recipe.inputsERC20[0].consumableType,
            inputsERC20[0].consumableType,
            'Input ERC20 consumable type mismatch!',
        );
        assert.equal(recipe.inputsERC20[0].amount, inputsERC20[0].amount, 'Input ERC20 amount mismatch!');
        assert.equal(
            recipe.inputsERC20[1].contractAddr,
            inputsERC20[1].contractAddr,
            'Input ERC20 contract addresses mismatch!',
        );

        // Check ERC721 inputs
        assert.equal(
            recipe.inputsERC721[0].contractAddr,
            inputsERC721[0].contractAddr,
            'Input ERC721 contract addresses mismatch!',
        );
        // Check ERC20 Output
        assert.equal(
            recipe.outputsERC20[0].contractAddr,
            outputsERC20[0].contractAddr,
            'Output ERC20 contract addresses mismatch!',
        );
        // Check ERC721 output
        assert.equal(
            recipe.outputsERC721[0].contractAddr,
            outputsERC721[0].contractAddr,
            'Output ERC721 contract addresses mismatch!',
        );
    });

    it('Recipe input/output creation requirements', async () => {
        // Contract
        const nftcrafter = await NFTCrafterTruffle.new();

        // Test no inputs
        const inputsERC721: Array<InputERC721> = [
            {
                contractAddr: '0x0000000000000000000000000000000000000011',
                consumableType: 0,
                amount: '2',
            },
        ];
        const outputsERC20: Array<OutputERC20> = [
            {
                contractAddr: '0x0000000000000000000000000000000000000020',
                amount: '2',
            },
        ];

        // No inputs / outputs
        let call;
        call = nftcrafter.createRecipe([], [], [], []);
        expect(call).eventually.to.rejectedWith(Error);

        // No outputs
        call = nftcrafter.createRecipe([], inputsERC721, [], []);
        expect(call).eventually.to.rejectedWith(Error);

        // No inputs
        call = nftcrafter.createRecipe([], [], outputsERC20, []);
        expect(call).eventually.to.rejectedWith(Error);

        // Correct call
        await nftcrafter.createRecipe([], inputsERC721, outputsERC20, []);
    });

    it('depositForRecipe invalid ERC721 array', async () => {
        // Create contract object
        const nftcrafter = await NFTCrafterTruffle.new();
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
        // Attempt to deposit (fails because of misshaped array)
        let call = nftcrafter.depositForRecipe(
            recipeId,
            craftAmount,
            [
                ['1', '2', '3'],
                ['4', '5'],
            ],
            { gas: 3000000 },
        );
        expect(call).eventually.to.rejectedWith(Error);

        // Misshaped Array 2 (too many outputs)
        call = nftcrafter.depositForRecipe(
            recipeId,
            craftAmount,
            [
                ['1', '2', '3'],
                ['4', '5', '6'],
                ['7', '8', '9'],
            ],
            { gas: 3000000 },
        );
        expect(call).eventually.to.rejectedWith(Error);
    });

    it('onlyRecipeCreator permission test', async () => {
        // Create contract object
        const nftcrafter = await NFTCrafterTruffle.new();
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
        const call = nftcrafter.depositForRecipe(recipeId, craftAmount, [['1', '2', '3']], {
            from: user,
            gas: 3000000,
        });
        expect(call).eventually.to.rejectedWith(Error);

        await nftcrafter.depositForRecipe(recipeId, craftAmount, [['1', '2', '3']], {
            from: owner,
            gas: 3000000,
        });
    });

    it('invalid withdrawAmount test', async () => {
        // Create contract object
        const nftcrafter = await NFTCrafterTruffle.new();
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
        await nftcrafter.depositForRecipe(recipeId, craftAmount, [['1', '2', '3']], {
            from: owner,
            gas: 3000000,
        });

        // Withdraw fails (withdrawAmount > craftableAmount)
        let call = nftcrafter.withdrawForRecipe(recipeId, withdrawAmount);
        expect(call).eventually.to.rejectedWith(Error);

        // Withdraw fails (withdrawAmount == 0)
        call = nftcrafter.withdrawForRecipe(recipeId, 0);
        expect(call).eventually.to.rejectedWith(Error);

        // Withdraw success (withdrawAmount == craftableAmount)
        await nftcrafter.withdrawForRecipe(recipeId, craftAmount, { gas: 3000000 });
    });

    it('depositForRecipe/withdrawForRecipe ERC20 outputs', async () => {
        // Create contract object
        const nftcrafter = await NFTCrafterTruffle.new();
        const [token1, token2] = await createERC20(2);
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
        await nftcrafter.depositForRecipe(recipeId, craftAmount, []);

        // Events testing
        let recipeEvent = await nftcrafter.getPastEvents('RecipeUpdate');
        assert.equal(recipeEvent[0].returnValues.craftableAmount, craftAmount, 'RecipeUpdate event not fired!');

        // Get recipe
        let recipe = parseRecipe(await nftcrafter.getRecipe(1));
        assert.equal(recipe.craftableAmount, '3', 'Resources not added correctly');

        // Confirm transfers
        assert((await token1.balanceOf(nftcrafter.address)).eqn(6), 'token1 not transferred!');
        assert((await token2.balanceOf(nftcrafter.address)).eqn(9), 'token2 not transferred!');

        // Withdraw out
        await nftcrafter.withdrawForRecipe(recipeId, withdrawCraftAmount);

        // Events testing
        recipeEvent = await nftcrafter.getPastEvents('RecipeUpdate');
        assert.equal(
            recipeEvent[0].returnValues.craftableAmount,
            craftAmount - withdrawCraftAmount,
            'RecipeUpdate (withdrawl) event not fired!',
        );

        // Get recipe
        recipe = parseRecipe(await nftcrafter.getRecipe(1));
        assert.equal(
            recipe.craftableAmount,
            String(craftAmount - withdrawCraftAmount),
            'Resources not withdrawn correctly',
        );

        // Confirm transfers
        assert((await token1.balanceOf(nftcrafter.address)).eqn(2), 'token1 not withdrawn!');
        assert((await token2.balanceOf(nftcrafter.address)).eqn(3), 'token2 not withdrawn!');
    });

    it('depositForRecipe/withdrawForRecipe ERC721 outputs', async () => {
        // Create contract object
        const nftcrafter = await NFTCrafterTruffle.new();
        const [token1, token2] = await createERC721(2);
        const recipeId = 1;
        const craftAmount = 3;
        const withdrawCraftAmount = 2;

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
        await nftcrafter.depositForRecipe(
            recipeId,
            craftAmount,
            [
                ['1', '2', '3'],
                ['4', '5', '6'],
            ],
            { gas: 3000000 },
        );

        // Get recipe
        let recipe = parseRecipe(await nftcrafter.getRecipe(1));
        assert.equal(recipe.craftableAmount, '3', 'Resources not added correctly');

        // Confirm successful transfer
        assert.equal(await token1.ownerOf(1), nftcrafter.address, 'Token1 transfer unsuccessful');
        assert.equal(await token2.ownerOf(4), nftcrafter.address, 'Token2 transfer unsuccessful');

        // Withdraw out
        await nftcrafter.withdrawForRecipe(recipeId, withdrawCraftAmount);

        // Get recipe
        recipe = parseRecipe(await nftcrafter.getRecipe(1));
        assert.equal(
            recipe.craftableAmount,
            String(craftAmount - withdrawCraftAmount),
            'Resources not withdrawn correctly',
        );

        // Confirm transfers
        assert.equal(await token1.ownerOf(1), nftcrafter.address, 'Token1 [1] withdraw unsuccessful');
        assert.equal(await token2.ownerOf(4), nftcrafter.address, 'Token2 [4] withdraw unsuccessful');

        assert.equal(await token1.ownerOf(2), owner, 'Token1 [2] withdraw unsuccessful');
        assert.equal(await token1.ownerOf(3), owner, 'Token1 [3] withdraw unsuccessful');
        assert.equal(await token1.ownerOf(5), owner, 'Token2 [5] withdraw unsuccessful');
        assert.equal(await token1.ownerOf(6), owner, 'Token3 [6] withdraw unsuccessful');
    });

    it('depositForRecipe/withdrawForRecipe ERC20 + ERC721', async () => {
        // Create contract object
        const nftcrafter = await NFTCrafterTruffle.new();

        const [nft1, nft2] = await createERC721(2);
        const [token1, token2] = await createERC20(2);

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
        await nftcrafter.depositForRecipe(
            recipeId,
            craftAmount,
            [
                ['1', '2', '3'],
                ['4', '5', '6'],
            ],
            { gas: 3000000 },
        );

        // Get recipe
        let recipe = parseRecipe(await nftcrafter.getRecipe(1));
        assert.equal(recipe.craftableAmount, '3', 'Resources not added correctly');

        // Confirm nft transfer
        assert.equal(await nft1.ownerOf(1), nftcrafter.address, 'Token1 transfer unsuccessful');
        assert.equal(await nft2.ownerOf(4), nftcrafter.address, 'Token2 transfer unsuccessful');

        // Confirm token transfers
        assert((await token1.balanceOf(nftcrafter.address)).eqn(6), 'token1 not transferred!');
        assert((await token2.balanceOf(nftcrafter.address)).eqn(9), 'token2 not transferred!');

        // Withdraw out
        await nftcrafter.withdrawForRecipe(recipeId, withdrawCraftAmount);

        // Get recipe
        recipe = parseRecipe(await nftcrafter.getRecipe(1));
        assert.equal(
            recipe.craftableAmount,
            String(craftAmount - withdrawCraftAmount),
            'Resources not withdrawn correctly',
        );

        // Confirm nft transfers
        assert.equal(await nft1.ownerOf(1), nftcrafter.address, 'Token1 [1] withdraw unsuccessful');
        assert.equal(await nft2.ownerOf(4), nftcrafter.address, 'Token2 [4] withdraw unsuccessful');

        assert.equal(await nft1.ownerOf(2), owner, 'Token1 [2] withdraw unsuccessful');
        assert.equal(await nft1.ownerOf(3), owner, 'Token1 [3] withdraw unsuccessful');
        assert.equal(await nft1.ownerOf(5), owner, 'Token2 [5] withdraw unsuccessful');
        assert.equal(await nft1.ownerOf(6), owner, 'Token3 [6] withdraw unsuccessful');

        // Confirm erc20 transfers
        assert((await token1.balanceOf(nftcrafter.address)).eqn(2), 'token1 not withdrawn!');
        assert((await token2.balanceOf(nftcrafter.address)).eqn(3), 'token2 not withdrawn!');
    });
});
