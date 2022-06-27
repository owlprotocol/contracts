//SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import '../MinterCore.sol';
import './IMinterSimpleMerkle.sol';

/**
 * @dev Decentralized NFT Minter contract
 *
 */
contract MinterSimpleMerkle is MinterCore {
    // Events
    event MintSpecies(uint256 indexed speciesId, address to, uint256 tokenId);

    /// @custom:oz-upgrades-unsafe-allow constructor
    constructor() initializer {}

    // Constructor
    function initialize() public override initializer {
        // Call parent initializer
        MinterCore.initialize();
        // Register ERC1820 Private Interface
        bytes32 interfaceName = keccak256('OWLProtocol://MinterSimpleMerkle');
        ERC1820ImplementerAuthorizeAll._registerInterfaceForAddress(interfaceName);
        // Register ERC165 Interface
        ERC165Storage._registerInterface(type(IMinterSimpleMerkle).interfaceId);
    }

    /**
     * @dev Create a new type of species and define attributes.
     * @param speciesId address of associated NFT
     * @param tokenId minted token id
     */
    function mint(
        uint256 speciesId,
        uint256 tokenId,
        bytes32 merkleRoot,
        bytes32[] calldata merkleProof
    ) public speciesExists(speciesId) mintAllowedMerkle(speciesId, merkleRoot, merkleProof) {
        // Mint Operation
        MinterCore._mintForFee(speciesId, msg.sender, tokenId);

        emit MintSpecies(speciesId, msg.sender, tokenId);
    }

    /**
     * @dev Create a new type of species and define attributes.
     * @param speciesId address of associated NFT
     * @param tokenId minted token id
     */
    function safeMint(
        uint256 speciesId,
        uint256 tokenId,
        bytes32 merkleRoot,
        bytes32[] calldata merkleProof
    ) public speciesExists(speciesId) mintAllowedMerkle(speciesId, merkleRoot, merkleProof) {
        // Mint Operation
        MinterCore._safeMintForFee(speciesId, msg.sender, tokenId);

        emit MintSpecies(speciesId, msg.sender, tokenId);
    }

    function hashKeccakUser() public view returns (bytes32) {
        return keccak256(abi.encode(msg.sender));
    }
}
