import SpecieTrait from './SpecieTrait';
import web3 from 'web3';
import { toBN } from 'web3-utils';
import Ajv from 'ajv';
import { Value, SpecieMetadataSchema, MetadataList, ValueRange } from '../types';
import BN from 'bn.js';
import colormaps from './colormaps';

const colorMap: SpecieTrait = new SpecieTrait('colormap', 'colormap', colormaps);

export interface Metadata {
    [key: string]: Value[];
}
class SpecieMetadata {
    //order in this array matter; earlier traits function as lower layers in image generation
    private overrides: Record<string, Record<string, string>> | undefined;
    private format?: Record<string, string>;
    private traits: SpecieTrait[];
    private maxBitSize: number;

    constructor(
        traits: SpecieTrait[],
        includeColorMap?: boolean,
        overrides?: Record<string, Record<string, string>>,
        format?: Record<string, string>,
    ) {
        if (includeColorMap) traits.push(colorMap);

        if (traits.find((e) => e.getTraitType() === 'dna') !== undefined)
            throw new Error('trait_type dna is reserved and cannot be used. Use another name for that trait_type');

        this.overrides = overrides;
        this.format = format;
        this.traits = traits;
        this.maxBitSize = traits.reduce((total, trait) => total + trait.getBitSize(), 0);
    }

    getJsonMetadata() {
        const jsonTraits = this.traits.map((trait) => trait.getJsonFormat());

        const asJson = {
            traits: jsonTraits,
            maxBitSize: this.maxBitSize,
        };
        if (this.overrides !== undefined) Object.assign(asJson, { overrides: this.overrides });
        if (this.format !== undefined)
            Object.assign(asJson, {
                format: this.format,
            });
        return asJson;
    }

    getSpecieMetadata(): SpecieTrait[] {
        return this.traits;
    }

    generateAllInstances(): MetadataList {
        const instances: MetadataList = {};
        for (let i = 0; toBN(i).lt(toBN(2).pow(toBN(this.maxBitSize))); i++) {
            try {
                instances[i] = this.dnaToAttributes(toBN(i));
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
    dnaToAttributes(n: BN): Value[] {
        if (!n.lt(toBN(2).pow(toBN(this.maxBitSize))) || n.lt(toBN(0))) throw new Error('Dna out of metadata range');
        const bin = n.toString(2, this.maxBitSize);
        const bitsList: number[] = this.traits.map((trait) => trait.getBitSize());
        const metadata: Value[] = [];

        let pos = 0;

        for (let i = 0; i < bitsList.length; i++) {
            const bits = bin.substring(bin.length - pos, bin.length - pos - bitsList[i]);

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

            pos += bitsList[i]; //update pointer
        }

        return metadata;
    }

    attributesToDna(metadata: Value[]): BN {
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

        return toBN(parseInt(finalBin, 2));
    }

    dnaToMetadata(n: string) {
        const tokenMetadata = this.dnaToAttributes(toBN(n));

        const tokenFormats = this.getFormat(n);

        const tokenOverrides = this.getOverride(n);

        let finalJson = { attributes: tokenMetadata };
        if (tokenFormats !== undefined) finalJson = { ...finalJson, ...tokenFormats };
        if (tokenOverrides !== undefined) finalJson = { ...finalJson, ...tokenOverrides };

        return finalJson;
    }

    getOverride(dna: string) {
        if (this.overrides === undefined) return undefined;
        const extraOverrides: Record<string, string> = {};
        for (const key in this.overrides) {
            if (this.overrides[key][dna] !== undefined) extraOverrides[key] = this.overrides[key][dna];
        }
        return extraOverrides;
    }

    getOverrides() {
        return this.overrides;
    }

    getFormat(dna: string) {
        if (this.format === undefined) return undefined;
        const extraFormat: Record<string, string> = {};
        const tokenMetadata = this.dnaToAttributes(toBN(dna));
        for (const key in this.format) {
            let keyString = this.format[key];

            const toFormatArr = this.format[key].match(new RegExp(/(?<=[$][{]\s*).*?(?=\s*})/gs));
            if (toFormatArr !== null) {
                for (let i = 0; i < toFormatArr?.length; i++) {
                    console.log(toFormatArr[i], keyString);

                    if (toFormatArr[i] === 'dna') keyString = keyString.replace(`$\{${toFormatArr[i]}}`, dna);
                    else
                        keyString = keyString.replace(
                            `$\{${toFormatArr[i]}}`,
                            //@ts-ignore
                            tokenMetadata.find((e) => e.trait_type === toFormatArr[i])?.value,
                        );
                }
            }
            extraFormat[key] = keyString;
        }
        console.log(extraFormat);

        return extraFormat;
    }

    getFormats() {
        return this.format;
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
        undefined,
        object.overrides,
        object.format,
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
