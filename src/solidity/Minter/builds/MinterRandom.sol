//SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "../MinterCore.sol";
import "../../Utils/SourceRandom.sol";

/**
 * @dev Decentralized NFT Minter contract
 *
 */
contract MinterAutoId is MinterCore {

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
        // Generate tokenid
        tokenId = SourceRandom.getRandomDebug();

        // Mint Operation
        MinterCore._mintForFee(speciesId, msg.sender, tokenId);

        emit MintSpecies(speciesId, msg.sender, tokenId);

        return tokenId;
    }

    /**
     * @dev Create a new type of species and define attributes.
     * @param speciesId address of associated NFT
     * @return tokenId minted token id
     */
    function safeMint(uint256 speciesId) public speciesExists(speciesId) returns (uint256 tokenId) {
        // Generate tokenId
        tokenId = SourceRandom.getRandomDebug();

        // Mint Operation
        MinterCore._safeMintForFee(speciesId, msg.sender, tokenId);

        emit MintSpecies(speciesId, msg.sender, tokenId);

        return tokenId;
    }

}
