//SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import '../PluginsCore.sol';

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
            // Gene details
            uint16 geneStartIdx = genes[geneIdx];
            uint16 geneEndIdx = geneIdx < genes.length - 1 ? genes[geneIdx + 1] : 256;

            uint256 bitmask = get256Bitmask(geneStartIdx, geneEndIdx);
            uint256 gene = (currDna & bitmask) >> geneStartIdx;

            uint256 maxBits = geneEndIdx - geneStartIdx;

            GeneMod memory currMod = modifications[geneIdx];
            if (currMod.geneTransformType == GeneTransformType.add) {
                uint256 sum = gene + currMod.value;
                if (sum > 2**maxBits - 1) gene = 2**maxBits - 1;
                else gene = sum;
            } else if (currMod.geneTransformType == GeneTransformType.sub) {
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
