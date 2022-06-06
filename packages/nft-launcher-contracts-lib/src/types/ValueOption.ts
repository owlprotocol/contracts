interface ValueOption {
    value_name: string;
    image?: string;
    value?: 'number' & 'enum';
}

export interface ValueRange {
    min: number;
    max: number;
}

export default ValueOption;
