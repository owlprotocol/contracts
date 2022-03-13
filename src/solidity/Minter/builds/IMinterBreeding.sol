//SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "../IMinterCore.sol";

/**
 * @dev Decentralized NFT Minter contract
 *
 */
interface IMinterBreeding is IMinterCore {

    /**
     * @dev Create a new type of species and define attributes.
     * @param speciesId address of associated NFT
     * @return tokenId minted token id
     */
    function breed(
        uint256 speciesId,
        uint256[] calldata parents
    ) external returns (uint256 tokenId);

    /**
     * @dev Create a new type of species and define attributes.
     * @param speciesId address of associated NFT
     * @return tokenId minted token id
     */
    function safeBreed(
        uint256 speciesId,
        uint256[] calldata parents
    ) external returns (uint256 tokenId);

    /**
     * @dev Create a new type of species and define attributes.
     * @param speciesId address of associated NFT
     * @return tokenId minted token id
     */
    function setBreedingRules(
        uint256 speciesId,
        uint8 requiredParents,
        uint256 breedCooldownSeconds,
        uint8[] memory genes,
        uint256[] memory mutationRates
    ) external returns (uint256 tokenId);

    /**
     * @dev Returns the current breeding rules used for a species
     * @param speciesId species identifier
     */
    function getBreedingRules(
        uint256 speciesId
    ) external view returns (
        uint8 requiredParents,
        uint256 breedCooldownSeconds,
        uint8[] memory genes,
        uint256[] memory mutationRates
    );

}
