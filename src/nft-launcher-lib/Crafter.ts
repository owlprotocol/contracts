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
}

export interface OutputERC20 {
    contractAddr: string;
    amount: string;
}

export interface OutputERC721 {
    contractAddr: string;
    ids: string[];
}
export interface Recipe {
    inputsERC20: InputERC20[];
    inputsERC721: InputERC721[];
    outputsERC20: OutputERC20[];
    outputsERC721: OutputERC721[];
    craftableAmount: string;
    craftedAmount: string;
}

export function parseRecipe(recipe: Record<string, unknown>) {
    const parsedRecipe: Recipe = {
        inputsERC20: [],
        inputsERC721: [],
        outputsERC20: [],
        outputsERC721: [],
        craftableAmount: '0',
        craftedAmount: '0',
    };
    // InputsERC20
    if (!Array.isArray(recipe.inputsERC20)) throw 'Mis-constructed recipe ERC20 input!';
    for (const inputERC20 of recipe.inputsERC20) {
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
    if (!Array.isArray(recipe.inputsERC721)) throw 'Mis-constructed recipe ERC721 input!';
    for (const inputERC721 of recipe.inputsERC721) {
        if (inputERC721.length != 2) {
            throw 'Mis-constructed ERC721 recipe inputs!';
        }
        parsedRecipe.inputsERC721.push({
            contractAddr: String(inputERC721[0]),
            consumableType: Number(inputERC721[1]),
        });
    }
    // OutputsERC20
    if (!Array.isArray(recipe.outputsERC20)) throw 'Mis-constructed recipe ERC20 output!';
    for (const outputERC20 of recipe.outputsERC20) {
        if (outputERC20.length != 2) {
            throw 'Mis-constructed ERC20 recipe outputs!';
        }
        parsedRecipe.outputsERC20.push({
            contractAddr: String(outputERC20[0]),
            amount: String(outputERC20[1]),
        });
    }
    // OutputsERC721
    if (!Array.isArray(recipe.outputsERC721)) throw 'Mis-constructed recipe ERC721 output!';
    for (const outputERC721 of recipe.outputsERC721) {
        if (outputERC721.length != 2) {
            throw 'Mis-constructed ERC721 recipe outputs!';
        }
        if (!Array.isArray(outputERC721[1])) {
            throw 'ERC721 recipe outputs must be an array!';
        }
        const ids: string[] = [];
        for (const id of outputERC721[1]) {
            ids.push(String(id));
        }
        parsedRecipe.outputsERC721.push({
            contractAddr: String(outputERC721[0]),
            ids: ids,
        });
    }
    // Craftable Amount
    parsedRecipe.craftableAmount = String(recipe.craftableAmount);
    parsedRecipe.craftedAmount = String(recipe.craftedAmount);

    return parsedRecipe;
}
