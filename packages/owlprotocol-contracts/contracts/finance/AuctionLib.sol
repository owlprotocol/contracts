//SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

/**
 * @dev Basic auction structures used through auction contracts.
 *
 */
library AuctionLib {
    // Token Types
    enum TokenType {
        erc721,
        erc1155
    }

    struct Asset {
        TokenType token;
        address contractAddr;
        uint256 tokenId;
    }
}
