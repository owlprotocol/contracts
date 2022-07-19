import { BigNumber, BigNumberish } from 'ethers';
export declare function encodeGenesUint256(values: BigNumberish[], genes: number[]): BigNumber;
export declare function decodeGenesUint256(dna: BigNumberish, genes: number[]): BigNumber[];
interface GeneKeys {
    name?: string;
    maxValue: BigNumberish;
}
export declare function simpleEncoder(genes: GeneKeys[], values: BigNumberish[]): BigNumber;
interface DecodedDna {
    [key: string]: BigNumber;
}
export declare function simpleDecoder(genes: GeneKeys[], dna: BigNumber): DecodedDna;
export declare function calculateValueSlots(genes: GeneKeys[]): number[];
export {};
