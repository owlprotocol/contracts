//SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "../IMinterCore.sol";

/**
 * @dev Decentralized NFT Minter contract
 *
 */
interface IMinterSimple is IMinterCore {

    /**
     * @dev Create a new type of species and define attributes.
     * @param speciesId address of associated NFT
     * @param tokenId minted token id
     */
    function mint(uint256 speciesId, uint256 tokenId) external;

    /**
     * @dev Create a new type of species and define attributes.
     * @param speciesId address of associated NFT
     * @param tokenId minted token id
     */
    function safeMint(uint256 speciesId, uint256 tokenId) external;

}
