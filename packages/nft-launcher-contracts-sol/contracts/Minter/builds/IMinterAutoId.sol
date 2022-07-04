//SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import '../IMinterCore.sol';

/**
 * @dev Decentralized NFT Minter contract
 *
 */
interface IMinterAutoId is IMinterCore {
    /**
     * @dev Create a new type of species and define attributes.
     * @param speciesId address of associated NFT
     * @return tokenId minted token id
     */
    function mint(uint256 speciesId) external returns (uint256 tokenId);

    /**
     * @dev Create a new type of species and define attributes.
     * @param speciesId address of associated NFT
     * @return tokenId minted token id
     */
    function safeMint(uint256 speciesId) external returns (uint256 tokenId);

    /**
     * @dev Used to set the starting nextTokenId value.
     * Used to save situtations where someone mints directly
     * and we get out of sync.
     * @param speciesId species identifier
     * @param nextTokenId_ next token id to be minted
     */
    function setNextTokenId(uint256 speciesId, uint256 nextTokenId_) external;
}
