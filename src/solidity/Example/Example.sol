//SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

/**
 * @dev Documentation for contract.
 *
 */
contract Example {
    /**
     * @notice Notice for user
     * @dev Dev docs
     * @param a first param
     * @param b second param
     * @return sum
     */
    function sum(uint256 a, uint256 b) public pure returns (uint256) {
        return a + b;
    }
}
