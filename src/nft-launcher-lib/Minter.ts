import { toBN } from 'web3-utils';
export interface Species {
    contractAddr: string;
    owner: string;
    mintFeeToken: string;
    mintFeeAmount: BN;
    mintFeeAddress: string;
}

export function parseSpecies(species: Record<string, unknown>) {
    const parsed: Species = {
        contractAddr: '',
        owner: '',
        mintFeeToken: '',
        mintFeeAddress: '',
        mintFeeAmount: toBN(0),
    };

    const stringVals = ['contractAddr', 'owner', 'mintFeeToken', 'mintFeeAddress'];
    for (const key of stringVals)
        if (typeof species[key] != 'string') throw `Mis-constructed species value: ${key}!`;
        //@ts-ignore
        else parsed[key] = species[key];

    const bnVals = ['mintFeeAmount'];
    //@ts-ignore
    for (const key of bnVals) parsed[key] = toBN(species[key]);

    return parsed;
}
