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
     * @return childDNA combined child DNA
     */
    function breedDNASimple(
        uint256[] calldata parents,
        uint8[] calldata genes,
        uint256 randomSeed
    ) internal pure returns (uint256 childDNA) {
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

            // Bitmasking
            uint256 bitMaskStart = type(uint256).max << geneStartIdx;
            uint256 bitMaskEnd = type(uint256).max >> (256 - geneEndIdx);
            uint256 bitMask = bitMaskStart & bitMaskEnd;
            // Isolate our gene
            uint256 gene = selectedParent & bitMask;

            // Save genes to childDNA
            childDNA = childDNA | gene;
        }

        return childDNA;
    }

    /**
     * @dev Breeds multiple parents DNA, returning a new combined DNA
     * Allows for random mutations to occur, producing random bits instead.
     * @param parents N different parent DNAs
     * @param genes start indicies of each gene.
     * First index should ALWAYS be 0. Using [0, 128] splits
     * the DNA into two genes of equal length
     * @param randomSeed random value to use for gene splicing
     * @param mutationRates probability that a random gene is picked vs. mutated.
     * A higher mutation rate means a higher probability of having a random gene.
     * The mutation rate m is a probability of m/(2^256-1) or in other words the
     * probability that geneRandomnessSeed <= m. We therefore assign a mutated
     * gene at the following rates according to m:
     * 0 = 000... => 0%
     * 2^254-1 = 001... => 25%
     * 2^255-1 = 011... => 50%
     * 2^255 + 2^254 -1 => 75%
     * 2^256-1 = 111... => 100% Always mutate
     * Calculated probability as a function: 1/2^(256-m)
     * @return childDNA combined child DNA with mutations occuring.
     */
    function breedDNAWithMutations(
        uint256[] calldata parents,
        uint8[] calldata genes,
        uint256 randomSeed,
        uint256[] calldata mutationRates
    ) internal pure returns (uint256 childDNA) {
        // Loop genes
        for (uint geneIdx = 0; geneIdx < genes.length; geneIdx++) {

            // Gene details
            uint256 geneStartIdx = genes[geneIdx];
            uint256 geneEndIdx;
            if (geneIdx < genes.length-1)
                geneEndIdx = genes[geneIdx+1];
            else
                geneEndIdx = 256;

            // Select parent / mutation
            uint256 selectedParent;
            uint256 geneMutationSeed = SourceRandom.getSeededRandom(randomSeed, geneIdx);
            if (geneMutationSeed <= mutationRates[geneIdx])
                selectedParent = SourceRandom.getSeededRandom(geneMutationSeed, 0);
            else
                selectedParent = parents[  // parents[randomParentIdx]
                    uint8(SourceRandom.getSeededRandom(randomSeed, geneIdx) % parents.length)
                ];

            // Bitmasking
            uint256 bitMaskStart = type(uint256).max << geneStartIdx;
            uint256 bitMaskEnd = type(uint256).max >> (256 - geneEndIdx);
            uint256 bitMask = bitMaskStart & bitMaskEnd;
            // Isolate our gene
            uint256 gene = selectedParent & bitMask;

            // Save genes to childDNA
            childDNA = childDNA | gene;
        }

        return childDNA;
    }

}
