interface ValueOption {
    value_name: string;
    image?: string;
    value?: string;
}

export interface ValueRange {
    min: number;
    max: number;
}

export default ValueOption;
