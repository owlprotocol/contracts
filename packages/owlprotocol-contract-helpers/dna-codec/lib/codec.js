"use strict";
exports.__esModule = true;
exports.calculateValueSlots = exports.simpleDecoder = exports.simpleEncoder = exports.decodeGenesUint256 = exports.encodeGenesUint256 = void 0;
var ethers_1 = require("ethers");
var bn_js_1 = require("bn.js");
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
function calculateValueSlots(genes) {
    // Convert all to BigNumber, calculate the total max values we're storing
    var bnMaxValues = genes.map(function (key) { return ethers_1.BigNumber.from(key.maxValue); });
    var maxValueSlots = bnMaxValues.map(function (v) { return nextBase2Ceil(v); });
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
function nextBase2Ceil(n) {
    // https://github.com/ethers-io/ethers.js/issues/889#issuecomment-653830188
    // TODO - drop BN type and try just *4 (1 hex = 4 binary slots (except on the last one))
    // Convert to BN.js type
    var bnNum = new bn_js_1.BN(n.toString());
    return bnNum.toString(2).length;
}
