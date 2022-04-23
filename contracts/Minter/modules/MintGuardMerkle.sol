//SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "../IMinterCore.sol";
import "@openzeppelin/contracts/utils/introspection/ERC165.sol";
import "@openzeppelin/contracts/utils/cryptography/MerkleProof.sol";

import "hardhat/console.sol";

/**
 * @dev MerkleTree-based Allowlist MintGuard for Minters
 *
 */
contract MintGuardMerkle is ERC165 {

    // TODO - events
    // TODO - docs

    // // Constructor
    // constructor () {
    //     // Register Private Name
    //     bytes32 interfaceName = keccak256("OWLProtocol://MinterCore");
    //     ERC1820ImplementerAuthorizeAll._registerInterfaceForAddress(interfaceName);
    //     // Register ERC165 Interface
    //     ERC165Storage._registerInterface(type(IMinterCore).interfaceId);
    // }

    // Store a hash of [ minterContract + speciesId + user ]
    // Allows us to condense the storage down to one slot
    mapping (bytes32 => bytes32) allowedMintRoots;

    modifier isSpeciesOwner(address minterContract, uint256 speciesId) {
        // Assert that this user actually has permission to do this
        address minterOwner;
        (,minterOwner,,,) = IMinterCore(minterContract).getSpecies(speciesId);
        require(minterOwner == msg.sender, "Not the owner!");
        _;
    }

    function addAllowedRoot(
        address minterContract,
        uint256 speciesId,
        bytes32 merkleRoot
    ) isSpeciesOwner(minterContract, speciesId) public {
        // Permission to this contract species for user
        bytes32 key = keccak256(abi.encode(minterContract, speciesId, merkleRoot));
        // Add user to allowed minters
        allowedMintRoots[key] = merkleRoot;
    }

    function removeAllowedRoot(
        address minterContract,
        uint256 speciesId,
        bytes32 merkleRoot
    ) isSpeciesOwner(minterContract, speciesId) public {
        // Permission to this contract species for user
        bytes32 key = keccak256(abi.encode(minterContract, speciesId, merkleRoot));
        // Permission to this contract species for user
        allowedMintRoots[key] = "";
    }

    function allowMint(
        uint256 speciesId,
        address user,
        bytes32 merkleRoot,
        bytes32[] calldata merkleProof
    ) public view returns (bool) {
        bytes32 key = keccak256(abi.encode(msg.sender, speciesId, merkleRoot));
        bytes32 storedMerkleRoot = allowedMintRoots[key];
        require(storedMerkleRoot == merkleRoot && storedMerkleRoot !=  "", "No permission set!");
        return MerkleProof.verify(merkleProof, merkleRoot, keccak256(abi.encode(user)));
    }

}
