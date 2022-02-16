//SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "./SourceRandom.sol";

/**
 * @dev Library used for combining uint256-encoded genes
 * Named Rosalind after chemist
 * Rosalind Franklin who discovered double-helix and significantly
 * furthered our understanding of DNAs molecular structure.
 */
library RosalindDNA {

    /**
     * @dev Breeds multiple parents DNA, returning a new combined
     * @param parents N different parent DNAs
     * @param genes start indicies of each gene.
     * First index should ALWAYS be 0. Using [0, 128] splits
     * the DNA into two genes of equal length
     * @param randomSeed random value to use for gene splicing
     */
    function breedDNASimple(
        uint256[] calldata parents,
        uint8[] calldata genes,
        uint256 randomSeed
    ) internal pure returns (uint256) {
        // Requires
        require(parents.length < 256, "No more than 255 parents allowed!");

        uint256 childDNA;

        // Loop genes
        for (uint geneIdx = 0; geneIdx < genes.length; geneIdx++) {

            // Gene details
            uint256 geneStartIdx = genes[geneIdx];
            uint256 geneEndIdx;
            if (geneIdx < genes.length-1)
                geneEndIdx = genes[geneIdx+1];
            else
                geneEndIdx = 256;

            // Select parent
            uint8 randomParentIdx = uint8(SourceRandom.getSeededRandom(randomSeed, geneIdx) % parents.length);
            uint256 selectedParent = parents[randomParentIdx];

            uint256 bitMaskStart = type(uint256).max << geneStartIdx;
            uint256 bitMaskEnd = type(uint256).max >> (256 - geneEndIdx);
            uint256 bitMask = bitMaskStart & bitMaskEnd;

            uint256 gene = selectedParent & bitMask;
            
            // Save genes to childDNA
            childDNA = childDNA | gene;
        }

        return childDNA;
    }

}
