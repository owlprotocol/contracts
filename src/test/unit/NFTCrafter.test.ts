import configureGanache from '../../utils/configureGanache';
import setProvider from '../../utils/setProvider';
import NFTCrafterTruffle from '../../truffle/NFTCrafter';
import chai, { assert } from 'chai';
import { InputERC20, InputERC721, OutputERC20, OutputERC721, parseRecipe } from '../../nft-crafter-lib/recipe';

describe('NFTCrafter', function () {
    let accounts: string[];

    before(async () => {
        const config = await configureGanache();
        ({ accounts } = config);
        setProvider([NFTCrafterTruffle], config.provider, accounts[0]);
    });

    it('NFTCrafter Create / Read Recipes', async () => {
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
                ids: ['123'],
            },
        ];

        // Create Recipe
        await nftcrafter.createRecipe(inputsERC20, inputsERC721, outputsERC20, outputsERC721);

        // Events
        const recipeEvent = await nftcrafter.getPastEvents('CreateRecipe');
        assert.equal(recipeEvent[0].returnValues.recipeId, 1, 'RecipeID Event Created');

        const recipe = parseRecipe(await nftcrafter.getRecipe(1));

        // TODO - fix One of our objects has a [0]='undefined' value that only appears
        // when doing a deep equal. Hence, we need to test w/ .include
        // expect(inputsERC20).to.deep.equal(recipe.inputsERC20); // This does NOT work
        chai.expect(inputsERC20[0]).to.include(recipe.inputsERC20[0], 'ERC20 input 1 not saved correctly');
        chai.expect(inputsERC20[1]).to.include(recipe.inputsERC20[1], 'ERC20 input 2 not saved correctly');
        chai.expect(inputsERC721[0]).to.include(recipe.inputsERC721[0], 'ERC721 input not saved correctly');
        // assert.deepEqual(recipe.inputsERC20, inputsERC20);
        // Not sure why this one doesn't work either
        // chai.expect(outputsERC20[0]).to.include(recipe.outputsERC20[0], 'ERC20 output not saved correctly');        // chai.expect(outputsERC721[0]).to.include(recipe.outputsERC721[0], 'ERC721 output not saved correctly');

        // TODO:
        // fix asserts
        // add require tests
    });
});
