//SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import '../utils/RosalindDNA.sol';

/**
 * @dev **INTERNAL TOOL**
 * Used to test RosalindDNA library.
 */
contract RosalindTestLab {
    /**
     * @dev Breeds multiple parents DNA, returning a new combined
     * @param parents N different parent DNAs
     * @param genes start indicies of each gene.
     * First index should ALWAYS be 0. Using [0, 128] splits
     * the DNA into two genes of equal length
     * @param randomSeed random value to use for gene splicing
     */
    function breedDNASimple(
        uint256[] memory parents,
        uint8[] memory genes,
        uint256 randomSeed
    ) public pure returns (uint256) {
        return RosalindDNA.breedDNASimple(parents, genes, randomSeed);
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
        uint256[] memory parents,
        uint8[] memory genes,
        uint256 randomSeed,
        uint256[] memory mutationRates
    ) public pure returns (uint256 childDNA) {
        return RosalindDNA.breedDNAWithMutations(parents, genes, randomSeed, mutationRates);
    }

    /**
     * @dev Mutates encoded DNA
     * @param dna existing DNA to mutate
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
     * @return mutatedDNA combined child DNA with mutations occuring.
     */
    function generateMutations(
        uint256 dna,
        uint8[] memory genes,
        uint256 randomSeed,
        uint256[] memory mutationRates
    ) public pure returns (uint256 mutatedDNA) {
        return RosalindDNA.generateMutations(dna, genes, randomSeed, mutationRates);
    }

    /**
     * @dev Gets the generation for a specimen
     * @param child child dna to read specimen age
     */
    function getGenCount(uint256 child) public pure returns (uint256) {
        // Returns the age of generation
        return RosalindDNA.getGenCount(child);
    }

    /**
     * @dev Sets an offsprings generation (increases max parent +1)
     * @param child child dna
     * @param parents array of parent dna
     */
    function setGenCount(uint256 child, uint256[] memory parents) public pure returns (uint256) {
        return RosalindDNA.setGenCount(child, parents);
    }
}
