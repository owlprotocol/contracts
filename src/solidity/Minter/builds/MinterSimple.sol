//SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "../MinterCore.sol";
import "./IMinterSimple.sol";

/**
 * @dev Decentralized NFT Minter contract
 *
 */
contract MinterSimple is MinterCore {

    // Events
    event MintSpecies(
        uint256 indexed speciesId,
        address to,
        uint256 tokenId
    );

    // Constructor
    constructor () {
        // Register ERC1820 Private Interface
        bytes32 interfaceName = keccak256("OWLProtocol://MinterSimple");
        ERC1820ImplementerAuthorizeAll._registerInterfaceForAddress(interfaceName);
        // Register ERC165 Interface
        ERC165Storage._registerInterface(type(IMinterSimple).interfaceId);
    }

    /**
     * @dev Create a new type of species and define attributes.
     * @param speciesId address of associated NFT
     * @param tokenId minted token id
     */
    function mint(uint256 speciesId, uint256 tokenId) public speciesExists(speciesId) {
        // Mint Operation
        MinterCore._mintForFee(speciesId, msg.sender, tokenId);

        emit MintSpecies(speciesId, msg.sender, tokenId);
    }

    /**
     * @dev Create a new type of species and define attributes.
     * @param speciesId address of associated NFT
     * @param tokenId minted token id
     */
    function safeMint(uint256 speciesId, uint256 tokenId) public speciesExists(speciesId) {
        // Mint Operation
        MinterCore._safeMintForFee(speciesId, msg.sender, tokenId);

        emit MintSpecies(speciesId, msg.sender, tokenId);
    }
}
