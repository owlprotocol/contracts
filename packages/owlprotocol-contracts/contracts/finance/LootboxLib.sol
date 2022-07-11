//SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

/**
 * @dev Basic auction structures used through lootbox contract.
 *
 */
library LootboxLib {
    // Token Types
    enum TokenType {
        erc20,
        erc721,
        erc1155
    }

    struct Asset {
        TokenType token;
        address contractAddr;
        uint256 tokenId;
        uint256 amount; //erc 20 and 1155 
    }
}