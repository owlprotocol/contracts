// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import './IRandomBeacon.sol';

/**
 * @dev abstract contract for all randomnes-generating contracts to implement.
 * All randomness-generating contracts must implement `getRandomness(uint256)`
 */
abstract contract RandomBeacon is IRandomBeacon {
    uint8 public override EPOCH_PERIOD;

    constructor(uint8 epochPeriod) {
        EPOCH_PERIOD = epochPeriod;
    }

    /**
     * @dev randomness will be generated in this function. Must be implemented
     * in child.
     */
    function getRandomness(uint256 blockNumber) external view virtual override returns (uint256);

    /**
     * @return currEpochBlock when current block expires
     */
    function epochBlockLatest() public view override returns (uint256 currEpochBlock) {
        currEpochBlock = epochBlock(block.number);
    }

    /**
     * @dev Return when epoch expires. Eg. blockNumber=0-99, period=100 => 100
     */
    function epochBlock(uint256 blockNumber) public view override returns (uint256) {
        return blockNumber - (blockNumber % EPOCH_PERIOD) + EPOCH_PERIOD;
    }
}
