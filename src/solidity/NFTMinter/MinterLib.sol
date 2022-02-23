//SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

/**
 * @dev NFT Minter common data types
 *
 */
library MinterLib {

    struct Species {
        address contractAddr;
        address owner;
        address mintFeeToken;
        uint256 mintFeeAmount;
        address mintFeeAddress;
        mapping(uint256 => uint256) specimenDNA;
    }

}
