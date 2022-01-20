export enum ConsumableType {
    unaffected,
    burned,
}

export interface InputERC20 {
    contractAddr: string;
    consumableType: ConsumableType;
    amount: string;
}

export interface InputERC721 {
    contractAddr: string;
    consumableType: ConsumableType;
    amount: string;
}

export interface OutputERC20 {
    contractAddr: string;
    amount: string;
}

export interface OutputERC721 {
    contractAddr: string;
    ids: Array<string>;
}
export interface Recipe {
    inputsERC20: Array<InputERC20>;
    inputsERC721: Array<InputERC721>;
    outputsERC20: Array<OutputERC20>;
    outputsERC721: Array<OutputERC721>;
    craftableAmount: string;
    craftedAmount: string;
}

export function parseRecipe(recipe: Record<number, unknown>) {
    const recipeVals = Object.values(recipe);
    const parsedRecipe: Recipe = {
        inputsERC20: [],
        inputsERC721: [],
        outputsERC20: [],
        outputsERC721: [],
        craftableAmount: '0',
        craftedAmount: '0',
    };

    // Overall check
    if (recipeVals.length != 6) {
        throw 'Mis-constructed recipe object!';
    }

    // InputsERC20
    if (!Array.isArray(recipeVals[0])) throw 'Mis-constructed recipe ERC20 input!';
    for (const inputERC20 of recipeVals[0]) {
        if (inputERC20.length != 3) {
            throw 'Mis-constructed ERC20 recipe inputs!';
        }
        parsedRecipe.inputsERC20.push({
            contractAddr: String(inputERC20[0]),
            consumableType: Number(inputERC20[1]),
            amount: String(inputERC20[2]),
        });
    }
    // InputsERC721
    if (!Array.isArray(recipeVals[1])) throw 'Mis-constructed recipe ERC721 input!';
    for (const inputERC721 of recipeVals[1]) {
        if (inputERC721.length != 3) {
            throw 'Mis-constructed ERC721 recipe inputs!';
        }
        parsedRecipe.inputsERC721.push({
            contractAddr: String(inputERC721[0]),
            consumableType: Number(inputERC721[1]),
            amount: String(inputERC721[2]),
        });
    }
    // OutputsERC20
    if (!Array.isArray(recipeVals[2])) throw 'Mis-constructed recipe ERC20 output!';
    for (const outputERC20 of recipeVals[2]) {
        if (outputERC20.length != 2) {
            throw 'Mis-constructed ERC20 recipe outputs!';
        }
        parsedRecipe.outputsERC20.push({
            contractAddr: String(outputERC20[0]),
            amount: String(outputERC20[1]),
        });
    }
    // OutputsERC721
    if (!Array.isArray(recipeVals[3])) throw 'Mis-constructed recipe ERC721 output!';
    for (const outputERC721 of recipeVals[3]) {
        if (outputERC721.length != 2) {
            throw 'Mis-constructed ERC721 recipe outputs!';
        }
        if (!Array.isArray(outputERC721[1])) {
            throw 'ERC721 recipe outputs must be an array!';
        }
        const ids: Array<string> = [];
        for (const id of outputERC721[1]) {
            ids.push(String(id));
        }
        parsedRecipe.outputsERC721.push({
            contractAddr: String(outputERC721[0]),
            ids: ids,
        });
    }
    // Craftable Amount
    parsedRecipe.craftableAmount = String(recipeVals[4]);
    parsedRecipe.craftedAmount = String(recipeVals[5]);

    return parsedRecipe;
}
