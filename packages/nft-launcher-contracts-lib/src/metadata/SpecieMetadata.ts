import SpecieTrait from './SpecieTrait';
import web3 from 'web3';
import Ajv from 'ajv';
import { Value, SpecieMetadataSchema, MetadataList } from '../types';

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

    getJsonMetadata() {
        const jsonTraits = this.traits.map((trait) => trait.getJsonFormat());

        return {
            traits: jsonTraits,
            maxBitSize: this.maxBitSize,
        };
    }

    getSpecieMetadata(): SpecieTrait[] {
        return this.traits;
    }

    generateAllInstances(): MetadataList {
        const instances: MetadataList = {};
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

    metadataToDna(metadata: Value[]): number {
        let finalBin = '';
        metadata.forEach((value: Value) => {
            const trait = this.traits.find(
                (specieTrait: SpecieTrait) => specieTrait.getTraitType() === value.trait_type,
            );
            if (!trait)
                throw new InvalidMetadataError(`Invalid trait ${value.trait_type} not found in this SpecieMetadata`);

            const index = trait.getValueOptions().findIndex((option) => value.value === option.value_name);
            if (index === -1)
                throw new InvalidMetadataError(
                    `Value ${value.value} for trait_type ${value.trait_type} not found in this SpecieMetadata `,
                );

            finalBin += web3.utils.padLeft(index.toString(2), trait.getBitSize());
        });

        return parseInt(finalBin, 2);
    }
}

export function validateSchema(object: any): boolean {
    const ajv = new Ajv();
    const valid = ajv.validate(SpecieMetadataSchema, object);
    if (!valid) throw new Error(ajv.errors?.map((e) => e.message).join(', '));
    return valid;
}

export function validateAndGetSchema(object: any): SpecieMetadata {
    validateSchema(object); // errors will be thrown in validateSchema()
    return new SpecieMetadata(
        object.traits.map((trait: any) => {
            const { trait_type, type, value_options, display_type, max_value, description } = trait;
            return new SpecieTrait(trait_type, type, value_options, display_type, max_value, description);
        }),
    );
}
export class InvalidDnaError extends Error {
    constructor() {
        super('Invalid Dna for this SpecieMetadata');
        this.name = 'InvalidDnaError';
    }
}

export class InvalidMetadataError extends Error {
    constructor(msg?: string) {
        if (!msg) super('Invalid Metadata for this SpecieMetadata');
        else super(msg);

        this.name = 'InvalidMetadataError';
    }
}

export default SpecieMetadata;
