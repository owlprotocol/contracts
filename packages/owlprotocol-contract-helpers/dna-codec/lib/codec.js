"use strict";
exports.__esModule = true;
exports.decodeGenesUint256 = exports.encodeGenesUint256 = exports.calculateValueSlots = exports.simpleEncoder = exports.simpleDecoder = void 0;
var ethers_1 = require("ethers");
var bn_js_1 = require("bn.js");
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
function simpleDecoder(genes, dna) {
    // Calculate gene storage slows
    var geneStorage = calculateValueSlots(genes);
    // Decode
    var decodedDna = decodeGenesUint256(dna, geneStorage);
    var returnDna = {};
    // Handle maxValue checks and take mod if needed.
    // Then turn into object
    for (var i = 0; i < decodedDna.length; i++) {
        var value = decodedDna[i];
        var max = genes[i].maxValue;
        // Take the mod if larger
        if (value.gt(max))
            decodedDna[i] = value.mod(max);
        var name_1 = (genes[i].name !== undefined ? genes[i].name : String(i));
        returnDna[name_1] = decodedDna[i];
    }
    return returnDna;
}
exports.simpleDecoder = simpleDecoder;
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
function simpleEncoder(genes, values) {
    // Same length
    if (genes.length !== values.length)
        throw 'genes.length !== values.lenth';
    // Ensure value !> maxValue
    for (var i = 0; i < genes.length; i++)
        if (values[i] > genes[i].maxValue)
            throw "value (".concat(values[i], ") passed at ").concat(i, " greater than maxValue (").concat(genes[i].maxValue, ")");
    // Calculate our gene slots
    var geneStorage = calculateValueSlots(genes);
    return encodeGenesUint256(values, geneStorage);
}
exports.simpleEncoder = simpleEncoder;
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
function calculateValueSlots(genes) {
    // Convert all to BigNumber, calculate the total max values we're storing
    var bnMaxValues = genes.map(function (key) { return ethers_1.BigNumber.from(key.maxValue); });
    var maxValueSlots = bnMaxValues.map(function (v) { return base2Ceil(v); });
    // Ensure we're not passing 256 bits of storage
    var total = maxValueSlots.reduce(function (a, b) { return a + b; });
    if (total > 256)
        throw 'not enough storage space! Reduce max values!';
    // Generate gene boundaries (used by encodeUint256(...))
    var start = 0;
    var geneStorage = [0];
    for (var i = 0; i < genes.length; i++) {
        // For the last slot, fill in the rest of the storage
        if (i === genes.length - 1) {
            start += maxValueSlots[i];
            geneStorage.push(start);
        }
    }
    return geneStorage;
}
exports.calculateValueSlots = calculateValueSlots;
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
function encodeGenesUint256(values, genes) {
    var encodedGenes = ethers_1.BigNumber.from(0);
    // Check value/gene lengths
    if (values.length != genes.length)
        throw 'mismatching values/genes length!';
    for (var geneIdx = 0; geneIdx < genes.length; geneIdx++) {
        // Type checks
        var geneValue = values[geneIdx];
        if (!ethers_1.BigNumber.isBigNumber(geneValue))
            geneValue = ethers_1.BigNumber.from(geneValue);
        // Calculate gene start
        var geneStartIdx = genes[geneIdx];
        // Check for overflows
        var geneEndIdx = 256;
        if (geneIdx < genes.length - 1)
            // If we're not on our last iteration, use the next value
            geneEndIdx = genes[geneIdx + 1];
        // Calculate our biggest possible value for this slot (2^n - 1)
        var geneSpace = ethers_1.BigNumber.from(2)
            .pow(ethers_1.BigNumber.from(geneEndIdx - geneStartIdx))
            .sub(1);
        //@ts-ignore
        if (geneSpace.lt(geneValue))
            throw "Value: ".concat(geneValue, " too large for it's slot!");
        // Perform bitwise left-shift on selectedGene
        var selectedGene = geneValue.shl(geneStartIdx);
        // Merge selected gene w/ our encoding
        //@ts-ignore
        encodedGenes = encodedGenes.or(selectedGene);
    }
    return encodedGenes;
}
exports.encodeGenesUint256 = encodeGenesUint256;
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
function decodeGenesUint256(dna, genes) {
    // Type checks
    if (!ethers_1.BigNumber.isBigNumber(dna))
        dna = ethers_1.BigNumber.from(dna);
    var decodedGenes = [];
    for (var geneIdx = 0; geneIdx < genes.length; geneIdx++) {
        // Calculate gene start/end
        var geneStartIdx = genes[geneIdx];
        var geneEndIdx = 256;
        if (geneIdx < genes.length - 1)
            // If we're NOT at the end of array, grab the next gene ending value
            geneEndIdx = genes[geneIdx + 1];
        // Extract gene value
        var geneValue = dna;
        if (geneEndIdx < 256)
            // Turn off all values past endIdx
            geneValue = geneValue.mask(geneEndIdx);
        // Bitwise right-shift
        geneValue = geneValue.shr(geneStartIdx);
        decodedGenes.push(geneValue);
    }
    return decodedGenes;
}
exports.decodeGenesUint256 = decodeGenesUint256;
/**
 * Like `Math.ceil` but returns the closest larger base2 by exponent. For example:
 * - The closest higher base2 of 3 -> 4, base2Ceil(3) = 2 as 2^2 = 4
 * - The closest higher base2 of 4 -> 4, base2Ceil(4) = 2 as 2^2 = 4
 * - The closest higher base2 of 7 -> 8, base2Ceil(7) = 3 as 2^3 = 8
 * - The closest higher base2 of 200 -> 256, base2Ceil(200) = 8 as 2^8 = 256
 *
 * @param n number to find the closest ceil
 * @returns the x-th exponent of the base2 ceil
 */
function base2Ceil(n) {
    // https://github.com/ethers-io/ethers.js/issues/889#issuecomment-653830188
    // TODO - drop BN type and try just *4 (1 hex = 4 binary slots (except on the last one))
    // Convert to BN.js type
    var bnNum = new bn_js_1.BN(n.toString());
    return bnNum.toString(2).length;
}
