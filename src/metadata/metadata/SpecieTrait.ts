import ValueOption from '../types/ValueOption';

export type DisplayType = 'number' | 'boost_number' | 'boost_percentage' | 'date';
export type SpecieTraitType = 'number' | 'enum' | 'Image';

class SpecieTrait {
    private trait_type: string;
    private type: SpecieTraitType;
    private value_options: ValueOption[];
    private value_bit_size: number;
    private display_type?: DisplayType;
    private max_value?: number;
    private description?: string;

    constructor(
        trait_type: string,
        type: SpecieTraitType,
        value_options: ValueOption[],
        display_type?: DisplayType,
        max_value?: number,
        description?: string,
    ) {
        this.trait_type = trait_type;
        this.type = type;
        this.value_options = value_options;
        this.display_type = display_type;
        this.max_value = max_value;
        this.description = description;

        if (this.value_options.length === 0) throw new Error('value_options array cannot be empty');
        if (this.value_options.length === 1) this.value_bit_size = 1;
        else this.value_bit_size = Math.ceil(Math.log2(value_options.length));
    }

    getJsonFormat() {
        return {
            trait_type: this.trait_type,
            type: this.type,
            value_options: this.value_options,
            value_bit_size: this.value_bit_size,
            dispaly_type: this.display_type,
            max_value: this.max_value,
            description: this.description,
        };
    }

    getValueOptions() {
        return this.value_options;
    }

    getBitSize() {
        return this.value_bit_size;
    }

    getTraitType() {
        return this.trait_type;
    }

    getAmountofTraits() {
        return this.value_options.length;
    }
}

export default SpecieTrait;
