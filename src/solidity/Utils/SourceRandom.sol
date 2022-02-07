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
    function getRandomDebug() internal view returns (uint256) {
        uint256 random = uint256(keccak256(abi.encode(block.timestamp)));
        require(random != 0);  // shouldn't ever happen but just to be safe.
        // TODO - should we add this?
        // if (random < 2**128)
        //     random += 2**128;
        return random;
    }

    /// @dev Returns a random uint256 sourced from a seed
    /// @return uint256 random value
    function getSeededRandom(bytes memory seed) internal pure returns (uint256) {
        uint256 random = uint256(keccak256(seed));
        require(random != 0);  // shouldn't ever happen but just to be safe
        // TODO - should we add this?
        // if (random < 2**128)
        //     random += 2**128;
        return random;
    }

    // function getRandomChainlink()

}
