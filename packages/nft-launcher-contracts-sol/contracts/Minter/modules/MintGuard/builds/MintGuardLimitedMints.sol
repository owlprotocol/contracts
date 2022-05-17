//SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import '../MintGuardCore.sol';
import '@openzeppelin/contracts/utils/introspection/ERC165.sol';

/**
 * @dev Allowlist MintGuard for Minter
 *
 */
contract MintGuardLimitedMints is MintGuardCore {
    event SetAllowedMints(address minterContract, uint256 speciesId, address user, uint64 mintsAllowed);

    // Store a hash of [ minterContract + speciesId + user ]
    // Allows us to condense the storage down to one slot
    mapping(bytes32 => uint64) allowedMints;

    /**
     * @dev Allowlist a user, under a species, under a minting contract to
     * mint X number of times.
     * @param minterContract minter contract address
     * @param speciesId species identifier
     * @param user user identifier
     * @param mintsAllowed number of mints allowed
     */
    function setUserMints(
        address minterContract,
        uint256 speciesId,
        address user,
        uint64 mintsAllowed
    ) public isSpeciesOwner(minterContract, speciesId) {
        // Permission to this contract species for user
        bytes32 key = keccak256(abi.encode(minterContract, speciesId, user));
        // Add user to allowed minters
        allowedMints[key] = mintsAllowed;
        // Emit
        emit SetAllowedMints(minterContract, speciesId, user, mintsAllowed);
    }

    /**
     * @dev Called externally from minter contract, to determine whether a mint is allowed.
     * @param speciesId species identifier
     * @param user user address
     */
    function allowMint(uint256 speciesId, address user) public returns (bool) {
        bytes32 key = keccak256(abi.encode(msg.sender, speciesId, user));
        uint64 mintsAllowed = allowedMints[key];

        if (mintsAllowed > 0) {
            // Check mints allowed
            allowedMints[key]--;
            return true;
        }
        // Else return false
        return false;
    }
}
