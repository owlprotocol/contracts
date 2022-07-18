import { BigNumber } from 'ethers';
export declare function encodeGenesUint256(values: (string | BigNumber | number)[], genes: number[]): BigNumber;
export declare function decodeGenesUint256(dna: BigNumber | string | number, genes: number[]): BigNumber[];
