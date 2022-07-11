// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

interface IRandomBeacon {
    event Update(uint256 blockNumber, uint256 value);

    function EPOCH_PERIOD() external view returns (uint256);

    function getRandomness(uint256 blockNumber) external view returns (uint256);

    function epochBlockLatest() external view returns (uint256);

    function epochBlock(uint256 blockNumber) external view returns (uint256);
}
