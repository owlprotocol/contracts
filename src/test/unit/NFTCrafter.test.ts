import configureGanache from '../../utils/configureGanache';
import setProvider from '../../utils/setProvider';
import NFTCrafterTruffle from '../../truffle/NFTCrafter';
import { padLeft } from 'web3-utils';

let lastAddr = 0;
let lastAmount = 0;
let lastConsumable = true;
let lastId = 0;

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

        // Create Recipe
        const inputsERC20 = [generateDummyInputERC20(), generateDummyInputERC20()];
        const inputsERC721 = [generateDummyInputERC721()];
        const outputsERC20 = [generateDummyOutputERC20()];
        const outputsERC721 = [generateDummyOutputERC721()];
        await nftcrafter.createRecipe(inputsERC20, inputsERC721, outputsERC20, outputsERC721);
        console.log(`Recipe: ${await nftcrafter.getRecipe(1)}`);
    });
});

function generateDummyInputERC20() {
    iterateDummyValues();
    return {
        contractAddr: padLeft(lastAddr, 40),
        consumableType: Number(lastConsumable),
        amount: lastAmount,
    };
}

function generateDummyInputERC721() {
    iterateDummyValues();
    return {
        contractAddr: padLeft(lastAddr, 40),
        consumableType: Number(lastConsumable),
        amount: lastAmount,
    };
}

function generateDummyOutputERC20() {
    iterateDummyValues();
    return {
        contractAddr: padLeft(lastAddr, 40),
        amount: lastAmount,
    };
}

function generateDummyOutputERC721() {
    iterateDummyValues();
    return {
        contractAddr: padLeft(lastAddr++, 40),
        ids: [lastId++, lastId++, lastId++],
    };
}

function iterateDummyValues() {
    lastId++;
    lastAddr++;
    lastAmount++;
    lastConsumable = !lastConsumable;
}
