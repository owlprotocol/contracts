//SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "../MinterCore.sol";

/**
 * @dev Decentralized NFT Minter contract
 *
 */
contract MinterAutoId is MinterCore {

    // Track our next tokenId for each species
    mapping (uint256 => uint256) private nextTokenId;

    // Events
    event MintSpecies(
        uint256 indexed speciesId,
        address to,
        uint256 tokenId
    );

    /**
     * @dev Create a new type of species and define attributes.
     * @param speciesId address of associated NFT
     * @return tokenId minted token id
     */
    function mint(uint256 speciesId) public speciesExists(speciesId) returns (uint256 tokenId) {
        // Increment tokenId
        nextTokenId[speciesId]++;

        // Mint Operation
        MinterCore._mintForFee(speciesId, msg.sender, nextTokenId[speciesId]);

        emit MintSpecies(
            speciesId,
            msg.sender,
            nextTokenId[speciesId]
        );

        return nextTokenId[speciesId];
    }

    /**
     * @dev Create a new type of species and define attributes.
     * @param speciesId address of associated NFT
     * @return tokenId minted token id
     */
    function safeMint(uint256 speciesId) public speciesExists(speciesId) returns (uint256 tokenId) {
        // Increment tokenId
        nextTokenId[speciesId]++;

        // Mint Operation
        MinterCore._safeMintForFee(speciesId, msg.sender, nextTokenId[speciesId]);

        emit MintSpecies(
            speciesId,
            msg.sender,
            nextTokenId[speciesId]
        );

        return nextTokenId[speciesId];
    }

    /**
     * @dev Used to set the starting nextTokenId value.
     * Used to save situtations where someone mints directly
     * and we get out of sync.
     * @param speciesId species identifier
     * @param nextTokenId_ next token id to be minted
     */
    function setNextTokenId(uint256 speciesId, uint256 nextTokenId_) public speciesOwner(speciesId) {
        nextTokenId[speciesId] = nextTokenId_;
    }

}
