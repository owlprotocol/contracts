"use strict";
exports.__esModule = true;
exports.decodeGenesUint256 = exports.encodeGenesUint256 = void 0;
var ethers_1 = require("ethers");
function encodeGenesUint256(values, genes) {
    var encodedGenes = ethers_1.BigNumber.from(0);
    // Check value/gene lengths
    if (values.length != genes.length)
        throw 'mismatching values/genes length!';
    for (var geneIdx = 0; geneIdx < genes.length; geneIdx++) {
        // Type checks
        var geneValue = values[geneIdx];
        if (typeof geneValue == 'string' || typeof geneValue == 'number')
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
    if (typeof dna == 'string' || typeof dna == 'number')
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
