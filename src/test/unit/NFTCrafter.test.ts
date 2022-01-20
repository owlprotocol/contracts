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

    before(async () => {
        const config = await configureGanache();
        ({ accounts } = config);
        setProvider([NFTCrafterTruffle], config.provider, accounts[0]);
        setProvider([FactoryERC20Truffle], config.provider, accounts[0]);
        setProvider([FactoryERC721Truffle], config.provider, accounts[0]);
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
        const call = nftcrafter.depositForRecipe(
            recipeId,
            craftAmount,
            [
                ['1', '2', '3'],
                ['4', '5'],
            ],
            { gas: 3000000 },
        );
        expect(call).eventually.to.rejectedWith(Error);
    });

    it('depositForRecipe ERC20 outputs', async () => {
        // Create contract object
        const nftcrafter = await NFTCrafterTruffle.new();
        const [token1, token2] = await createERC20(2);
        const recipeId = 1;
        const craftAmount = 3;

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
        const recipeEvent = await nftcrafter.getPastEvents('RecipeDeposit');
        assert.equal(recipeEvent[0].returnValues.craftAmount, craftAmount, 'RecipeDeposit event not fired!');

        // Get recipe
        const recipe = parseRecipe(await nftcrafter.getRecipe(1));
        assert.equal(recipe.craftableAmount, '3', 'Resources not added correctly');

        // Confirm transfers
        assert((await token1.balanceOf(nftcrafter.address)).eqn(6), 'token1 not transferred!');
        assert((await token2.balanceOf(nftcrafter.address)).eqn(9), 'token2 not transferred!');
    });

    it('depositForRecipe ERC721 outputs', async () => {
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
        const recipe = parseRecipe(await nftcrafter.getRecipe(1));
        assert.equal(recipe.craftableAmount, '3', 'Resources not added correctly');

        // Confirm successful transfer
        assert.equal(await token1.ownerOf(1), nftcrafter.address, 'Token1 transfer unsuccessful');
        assert.equal(await token2.ownerOf(4), nftcrafter.address, 'Token2 transfer unsuccessful');
    });

    it('depositForRecipe ERC20 + ERC721', async () => {
        // Create contract object
        const nftcrafter = await NFTCrafterTruffle.new();

        const [nft1, nft2] = await createERC721(2);
        const [token1, token2] = await createERC20(2);

        const recipeId = 1;
        const craftAmount = 3;

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
        const recipe = parseRecipe(await nftcrafter.getRecipe(1));
        assert.equal(recipe.craftableAmount, '3', 'Resources not added correctly');

        // Confirm successful transfer
        assert.equal(await nft1.ownerOf(1), nftcrafter.address, 'Token1 transfer unsuccessful');
        assert.equal(await nft2.ownerOf(4), nftcrafter.address, 'Token2 transfer unsuccessful');

        // Confirm transfers
        assert((await token1.balanceOf(nftcrafter.address)).eqn(6), 'token1 not transferred!');
        assert((await token2.balanceOf(nftcrafter.address)).eqn(9), 'token2 not transferred!');
    });
});
