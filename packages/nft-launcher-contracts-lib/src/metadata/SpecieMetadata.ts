import SpecieTrait from './SpecieTrait';
import web3 from 'web3';
import Ajv from 'ajv';
import { Value, SpecieMetadataSchema, MetadataList, ValueRange } from '../types';
import BN from 'bn.js';

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
        for (let i = 0; bn(i).lt(bn(2).pow(bn(this.maxBitSize))); i++) {
            try {
                instances[i] = this.dnaToMetadata(bn(i));
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
    dnaToMetadata(n: BN): Value[] {
        if (!n.lt(bn(2).pow(bn(this.maxBitSize))) || n.lt(bn(0))) throw new Error('Dna out of metadata range');
        const bin = n.toString(2, this.maxBitSize);
        // const bin =
        // '10111011101010001111110011000101000101010101010100100101000110101101010101111100010101010011001000111110001000010001110000000000000000000000000000000000';
        const bitsList: number[] = this.traits.map((trait) => trait.getBitSize());
        const metadata: Value[] = [];

        let pos = 0;
        console.log(bin);
        console.log(n, n.toString);
        for (let i = 0; i < bitsList.length; i++) {
            let bits;

            bits = bin.substring(bin.length - pos, bin.length - pos - bitsList[i]);

            const currTrait = this.traits[i];
            const options = currTrait.getValueOptions();
            const valueIndex = parseInt(bits, 2);
            let value: string;
            if (
                valueIndex >=
                (Array.isArray(options) ? options.length : (options as ValueRange).max - (options as ValueRange).min)
            )
                throw new InvalidDnaError();
            else
                value = Array.isArray(options)
                    ? options[valueIndex].value_name
                    : ((options as ValueRange).min + valueIndex).toString();

            metadata.push({ trait_type: currTrait.getTraitType(), value });
            console.log({ trait_type: currTrait.getTraitType(), value, bits });

            pos += bitsList[i]; //update pointer
        }

        return metadata;
    }

    metadataToDna(metadata: Value[]): BN {
        let finalBin = '';
        metadata.forEach((value: Value) => {
            const trait = this.traits.find(
                (specieTrait: SpecieTrait) => specieTrait.getTraitType() === value.trait_type,
            );
            if (!trait)
                throw new InvalidMetadataError(`Invalid trait ${value.trait_type} not found in this SpecieMetadata`);

            const options = trait.getValueOptions();
            let index;
            if (Array.isArray(options)) index = options.findIndex((option) => value.value === option.value_name);
            else index = (options as ValueRange).max - (options as ValueRange).min;

            if (index === -1)
                throw new InvalidMetadataError(
                    `Value ${value.value} for trait_type ${value.trait_type} not found in this SpecieMetadata `,
                );

            finalBin += web3.utils.padLeft(index.toString(2), trait.getBitSize());
        });

        return bn(parseInt(finalBin, 2));
    }
}

export function bn(i: number) {
    return new BN(i);
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
