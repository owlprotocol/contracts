//SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

/**
 * @dev Sources different levels of randomness
 *
 */
library SourceRandom {

    /// @notice Not truly random. Use for debugging only
    /// @dev Returns a random uint256 sourced from the current time
    /// @return uint256 random value
    function getRandomDebug() internal returns (uint256) {
        return uint256(keccak256(block.timestamp));
    }

    // function getRandomChainlink()

}
