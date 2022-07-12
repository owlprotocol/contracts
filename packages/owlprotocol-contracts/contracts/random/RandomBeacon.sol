// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import './IRandomBeacon.sol';

abstract contract RandomBeacon is IRandomBeacon {
    uint256 public override EPOCH_PERIOD; //make this a uint16?

    constructor(uint256 epochPeriod) {
        EPOCH_PERIOD = epochPeriod;
    }

    function getRandomness(uint256 blockNumber) external view virtual override returns (uint256);

    function epochBlockLatest() public view override returns (uint256) {
        return epochBlock(block.number);
    }

    //Return when epoch expires
    //Eg. blockNumber=0-99, period=100 => 100
    function epochBlock(uint256 blockNumber) public view override returns (uint256) {
        return blockNumber - (blockNumber % EPOCH_PERIOD) + EPOCH_PERIOD;
    }
}
