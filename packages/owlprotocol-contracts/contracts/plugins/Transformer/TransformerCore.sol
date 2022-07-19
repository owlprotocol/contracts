//SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import '../PluginsCore.sol';

/**
 * @dev abstract contract that contains all the utilities and types required for
 * Transformer contract
 */
abstract contract TransformerCore is PluginsCore {
    enum GeneTransformType {
        none,
        add,
        sub,
        mult,
        set
    }

    // Defines specification of how a specific gene is transformed
    struct GeneMod {
        GeneTransformType geneTransformType;
        uint256 value;
    }

    /**********************
           Utilities
    **********************/

    /**
     * @dev Uses bitmask to transform inputted DNA according to modifications
     * @param currDna original DNA, represented in base 10
     * @param genes array representing start indexes of genes within binary
     * representation of currDna
     * @param modifications array describing modifications to each gene
     * @return newDna the transformed DNA
     */
    function transform(
        uint256 currDna,
        uint8[] memory genes,
        GeneMod[] memory modifications
    ) internal pure returns (uint256 newDna) {
        for (uint16 geneIdx = 0; geneIdx < genes.length; geneIdx++) {
            // Genes array gives index ranges on the binary format of currDna
            uint16 geneStartIdx = genes[geneIdx];
            // If on last element of genes, set end to 256
            uint16 geneEndIdx = geneIdx < genes.length - 1 ? genes[geneIdx + 1] : 256;

            uint256 bitmask = get256Bitmask(geneStartIdx, geneEndIdx);

            // Once the bitmask extracts the gene that needs to be operated on
            // in the iteration, the binary data needs to be shifted all the way
            // to the right so that operations are done on the gene as if it was
            // its own individual number. If we have dna '01 10 01' and we're
            // working on the '10'. Adding one needs to yield '11', not '10 01'.
            // So after bitmask, '10 00' was shifted to '00 10' so operations
            // are done correctly
            uint256 gene = (currDna & bitmask) >> geneStartIdx;

            uint256 maxBits = geneEndIdx - geneStartIdx;

            // Execution of modifications
            GeneMod memory currMod = modifications[geneIdx];
            if (currMod.geneTransformType == GeneTransformType.add) {
                uint256 sum = gene + currMod.value;

                // Handle overflow with ceiling
                if (sum > 2**maxBits - 1) gene = 2**maxBits - 1;
                else gene = sum;
            } else if (currMod.geneTransformType == GeneTransformType.sub) {
                // Handle underflow with floor
                if (currMod.value > gene) gene = 0;
                else gene = gene - currMod.value;
            } else if (currMod.geneTransformType == GeneTransformType.mult) {
                uint256 prod = gene * currMod.value;
                if (prod > 2**maxBits - 1) gene = 2**maxBits - 1;
                else gene = prod;
            } else if (currMod.geneTransformType == GeneTransformType.set) {
                // Set must be in range, otherwise ignored
                if (currMod.value <= 2**maxBits - 1 && currMod.value >= 0) gene = currMod.value;
            }

            // Shift back to original representation
            gene = gene << geneStartIdx;

            newDna = newDna | gene;
        }
    }

    /**
     * @dev Generates a 256-bit bitmask from startBit:endBit
     * @param startBit beginning of mask
     * @param endBit end of mask
     * @return bitMask combined bitmask
     */
    function get256Bitmask(uint16 startBit, uint16 endBit) internal pure returns (uint256 bitMask) {
        uint256 bitMaskStart = type(uint256).max << startBit;
        uint256 bitMaskEnd = type(uint256).max >> (256 - endBit);
        bitMask = bitMaskStart & bitMaskEnd;
    }
}
