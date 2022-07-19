import { BigNumber, BigNumberish } from 'ethers';
interface DecodedDna {
    [key: string]: BigNumber;
}
/**
 * Intelligently calculates a decoded uint256 BigNumber based on the values
 * that you provide. The `genes` field should be universal and unchanging for
 * all species in a collection. In order words, the **same** `genes` field
 * should be used to parse every asset in a collection. On the other hand, the
 * `values` field will be specific to each NFT and is what contains the DNA
 * attributes. In the event that you would like to adjust or extend these
 * boundaries, you should first pause your current plugins using these values
 * and deploy new ones.
 *
 * @param genes array of `GeneKeys` to encode
 * @param dna uint256 BigNumber containing encoded DNA
 * @returns values encoded in the gene
 */
export declare function simpleDecoder(genes: GeneKeys[], dna: BigNumber): DecodedDna;
interface GeneKeys {
    name?: string;
    maxValue: BigNumberish;
}
/**
 * Intelligently calculates an encoded uint256 BigNumber based on the values
 * that you provide. The `genes` field should be universal and unchanging for
 * all species in a collection. In order words, the **same** `genes` field
 * should be used to parse every asset in a collection. On the other hand, the
 * `values` field will be specific to each NFT and is what contains the DNA
 * attributes. In the event that you would like to adjust or extend these
 * boundaries, you should first pause your current plugins using these values
 * and deploy new ones.
 *
 * Values are packed into a uint256 based on the `GeneKeys.maxValue` trait.
 * @param genes array of `GeneKeys` to encode
 * @param values values to encode in genes
 * @returns uint256 BigNumber containing encoded DNA
 */
export declare function simpleEncoder(genes: GeneKeys[], values: BigNumberish[]): BigNumber;
/**
 * Calculates the value slots to be used for a certain list of genes. This is
 * done intelligently based on the `maxValue` field provided. This function will
 * find the closest base2 multiple of `maxValue` and use that, to allow for the
 * entire keyspace required.
 *
 * @param genes array of `GeneKeys` to calculate boundaries for.
 * @returns Array of numbers indicating gene boundaries.
 * For example, [0, 10, 14] indicates 3 slots:
 * - 0:9 -> max value: 2^10-1 = 1,023
 * - 10:13 -> max value: 2^4-1 = 15
 * - 14:255 -> max value: 2^241 =
 * 3533694129556768659166595001485837031654967793751237916243212402585239552
 */
export declare function calculateValueSlots(genes: GeneKeys[]): number[];
/**
 * Allows you to encode a series of values into a uint256 BigNumber object.
 * Unless you know what you're doing and need fine-grained control over how your
 * data is stored and parsed, you likely want to use `simpleEncoder` instead!
 *
 * @param values Series of values to pack into a uint256. Must not exceed
 * 2^256-1
 * @param genes Boundaries to store values within a uint256, end
 * non-inclusive!  For example, passing [0, 10, 14] will create 3 slots:
 * - 0:9 -> max value: 2^10-1 = 1,023
 * - 10:13 -> max value: 2^4-1 = 15
 * - 14:255 -> max value: 2^241 =
 * 3533694129556768659166595001485837031654967793751237916243212402585239552
 *
 * If you attempt passing a value too large for a storage spot, the function
 * will throw!
 *
 * @returns Encoded DNA in the form of a BigNumber (size uint256)
 */
export declare function encodeGenesUint256(values: BigNumberish[], genes: number[]): BigNumber;
/**
 * Allows you to decode a uint256 BigNumber object into a series of dna attributes.
 * Unless you know what you're doing and need fine-grained control over how your
 * data is stored and parsed, you likely want to use `simpleDecoder` instead!
 *
 * @param dna uint256 BigNumber object representing your dna
 * @param genes Boundaries to store values within a uint256, end
 * non-inclusive! For example, passing [0, 10, 14] will create 3 slots:
 * - 0:9 -> max value: 2^10-1 = 1,023
 * - 10:13 -> max value: 2^4-1 = 15
 * - 14:255 -> max value: 2^241 =
 * 3533694129556768659166595001485837031654967793751237916243212402585239552
 *
 * @returns Decoded DNA as an array of BigNumbers
 */
export declare function decodeGenesUint256(dna: BigNumberish, genes: number[]): BigNumber[];
export {};
