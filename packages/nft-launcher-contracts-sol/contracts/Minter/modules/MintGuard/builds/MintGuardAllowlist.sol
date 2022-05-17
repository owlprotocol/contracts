//SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import '../MintGuardCore.sol';
import '@openzeppelin/contracts/utils/introspection/ERC165.sol';

/**
 * @dev Allowlist MintGuard for Minter
 *
 */
contract MintGuardAllowlist is MintGuardCore {
    event AddAllowedUser(address minterContract, uint256 speciesId, address user);

    event RemoveAllowedUser(address minterContract, uint256 speciesId, address user);

    // Store a hash of [ minterContract + speciesId + user ]
    // Allows us to condense the storage down to one slot
    mapping(bytes32 => bool) allowedMinters;

    /**
     * @dev Allowlist a user, under a species, under a minting contract.
     * @param minterContract minter contract address
     * @param speciesId species identifier
     * @param user user identifier
     */
    function addAllowedUser(
        address minterContract,
        uint256 speciesId,
        address user
    ) public isSpeciesOwner(minterContract, speciesId) {
        // Permission to this contract species for user
        bytes32 key = keccak256(abi.encode(minterContract, speciesId, user));
        // Add user to allowed minters
        allowedMinters[key] = true;
        // Emit
        emit AddAllowedUser(minterContract, speciesId, user);
    }

    /**
     * @dev Remove a user, under a species, under a minting contract.
     * @param minterContract minter contract address
     * @param speciesId species identifier
     * @param user user identifier
     */
    function removeAllowedUser(
        address minterContract,
        uint256 speciesId,
        address user
    ) public isSpeciesOwner(minterContract, speciesId) {
        // Permission to this contract species for user
        bytes32 key = keccak256(abi.encode(minterContract, speciesId, user));
        // Permission to this contract species for user
        allowedMinters[key] = false;
        // Emit
        emit RemoveAllowedUser(minterContract, speciesId, user);
    }

    /**
     * @dev Called externally from minter contract, to determine whether a mint is allowed.
     * @param speciesId species identifier
     * @param user user address
     */
    function allowMint(uint256 speciesId, address user) public view returns (bool) {
        bytes32 key = keccak256(abi.encode(msg.sender, speciesId, user));
        return allowedMinters[key];
    }
}
