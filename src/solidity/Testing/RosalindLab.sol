//SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "../Utils/RosalindDNA.sol";

/**
 * @dev **INTERNAL TOOL**
 * Used to test RosalindDNA library.
 */
contract RosalindLab {

    /**
     * @dev Breeds multiple parents DNA, returning a new combined
     * @param parents N different parent DNAs
     * @param genes start indicies of each gene.
     * First index should ALWAYS be 0. Using [0, 128] splits
     * the DNA into two genes of equal length
     * @param randomSeed random value to use for gene splicing
     */
    function testBreedDNASimple(
        uint256[] calldata parents,
        uint8[] calldata genes,
        uint256 randomSeed
    ) internal pure returns (uint256) { return RosalindDNA.breedDNASimple(parents, genes, randomSeed); }

}
