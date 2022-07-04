//SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import '../../IMinterCore.sol';
import '@openzeppelin/contracts/utils/introspection/ERC165.sol';

/**
 * @dev Control whether mints are allowed or denied.
 *
 */
abstract contract MintGuardCore is ERC165 {
    // Verifies rules are only set by species owners.
    modifier isSpeciesOwner(address minterContract, uint256 speciesId) {
        // Assert that this user actually has permission to do this
        address minterOwner;
        (, minterOwner, , , ) = IMinterCore(minterContract).getSpecies(speciesId);
        require(minterOwner == msg.sender, 'Not the owner!');
        _;
    }
}
