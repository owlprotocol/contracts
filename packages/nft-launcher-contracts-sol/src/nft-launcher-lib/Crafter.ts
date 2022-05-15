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
