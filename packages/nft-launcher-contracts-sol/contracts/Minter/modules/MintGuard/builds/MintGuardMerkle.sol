//SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import '../MintGuardCore.sol';
import '@openzeppelin/contracts/utils/introspection/ERC165.sol';
import '@openzeppelin/contracts/utils/cryptography/MerkleProof.sol';

import 'hardhat/console.sol';

/**
 * @dev MerkleTree-based Allowlist MintGuard for Minters
 *
 */
contract MintGuardMerkle is MintGuardCore {
    event SetAllowedRoot(address minterContract, uint256 speciesId, bytes32 merkleRoot);

    // Store a hash of [ minterContract + speciesId + user ]
    // Allows us to condense the storage down to one slot
    mapping(bytes32 => bytes32) allowedMintRoots;

    /**
     * @dev Set allowed merkle root used to verify leaves for minting.
     * @param minterContract minter contract address
     * @param speciesId species identifier
     * @param merkleRoot (keccak256) root of merkle tree
     */
    function addAllowedRoot(
        address minterContract,
        uint256 speciesId,
        bytes32 merkleRoot
    ) public isSpeciesOwner(minterContract, speciesId) {
        // Permission to this contract species for user
        bytes32 key = keccak256(abi.encode(minterContract, speciesId, merkleRoot));
        // Add user to allowed minters
        allowedMintRoots[key] = merkleRoot;
        // Emit
        emit SetAllowedRoot(minterContract, speciesId, merkleRoot);
    }

    /**
     * @dev Remove allowed merkle root used to verify leaves for minting.
     * @param minterContract minter contract address
     * @param speciesId species identifier
     * @param merkleRoot (keccak256) root of merkle tree
     */
    function removeAllowedRoot(
        address minterContract,
        uint256 speciesId,
        bytes32 merkleRoot
    ) public isSpeciesOwner(minterContract, speciesId) {
        // Permission to this contract species for user
        bytes32 key = keccak256(abi.encode(minterContract, speciesId, merkleRoot));
        // Permission to this contract species for user
        allowedMintRoots[key] = '';
        // Emit
        emit SetAllowedRoot(minterContract, speciesId, merkleRoot);
    }

    /**
     * @dev Called externally from minter contract, to determine whether a mint is allowed.
     * @param speciesId species identifier
     * @param user user address
     * @param merkleRoot merkle root to verify
     * @param merkleProof proofs to generate root
     */
    function allowMint(
        uint256 speciesId,
        address user,
        bytes32 merkleRoot,
        bytes32[] calldata merkleProof
    ) public view returns (bool) {
        bytes32 key = keccak256(abi.encode(msg.sender, speciesId, merkleRoot));
        bytes32 storedMerkleRoot = allowedMintRoots[key];
        require(storedMerkleRoot == merkleRoot && storedMerkleRoot != '', 'No permission set!');
        return MerkleProof.verify(merkleProof, merkleRoot, keccak256(abi.encode(user)));
    }
}
