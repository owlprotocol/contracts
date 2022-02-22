import SpecieTrait from './SpecieTrait';
import web3 from 'web3';
import { Value } from '../types';

export interface Metadata {
    [key: string]: Value[];
}
class SpecieMetadata {
    //order in this array matter; earlier traits function as lower layers in image generation
    private traits: SpecieTrait[];
    private maxBitSize: number;

    constructor(traits: SpecieTrait[]) {
        this.traits = traits;
        this.maxBitSize = traits.reduce((total, trait) => total + trait.getBitSize(), 0);
    }

    getSpecieMetadata(): SpecieTrait[] {
        return this.traits;
    }

    generateAllInstances(): Metadata {
        const instances: Metadata = {};
        for (let i = 0; i < 2 ** this.maxBitSize; i++) {
            try {
                instances[i] = this.dnaToMetadata(i);
            } catch (err) {
                //ignores invalid dnas (some undefined trait(s))
                if ((err as Error).name === 'InvalidDnaError') continue;
                else throw err;
            }
        }
        return instances;
    }

    getMaxBitSize(): number {
        return this.maxBitSize;
    }

    //left most bits represent top most traits in triats list
    dnaToMetadata(n: number): Value[] {
        if (!(n < 2 ** this.maxBitSize) || n < 0) throw new Error('Dna out of metadata range');

        const bin = web3.utils.padLeft(n.toString(2), this.maxBitSize);
        const bitsList: number[] = this.traits.map((trait) => trait.getBitSize());
        const metadata: Value[] = [];

        for (let i = 0; i < bitsList.length; i++) {
            let bits;

            const prevSum = bitsList.slice(0, i).reduce((p, n) => p + n, 0);
            const currSum = bitsList.slice(0, i + 1).reduce((p, n) => p + n, 0);

            if (i == 0) bits = bin.substring(0, bitsList[1]);
            else bits = bin.substring(prevSum, currSum);

            const currTrait = this.traits[i];
            const options = currTrait.getValueOptions();
            const valueIndex = parseInt(bits, 2);
            let value;
            if (valueIndex >= options.length) throw new InvalidDnaError();
            else value = options[valueIndex].value_name;

            metadata.push({ trait_type: currTrait.getTraitType(), value });
        }

        return metadata;
    }
}

export class InvalidDnaError extends Error {
    constructor() {
        super('Invalid Dna for this SpecieMetadata');
        this.name = 'InvalidDnaError';
    }
}

export default SpecieMetadata;
