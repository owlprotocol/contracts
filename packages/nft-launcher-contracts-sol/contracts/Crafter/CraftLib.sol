//SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import '@openzeppelin/contracts/token/ERC20/IERC20.sol';
import '@openzeppelin/contracts/token/ERC721/IERC721.sol';

/**
 * @dev Basic crafting structures used through NFTCrafting contracts.
 *
 */
library CraftLib {
    // Recipe Components
    enum ConsumableType {
        unaffected,
        burned,
        locked
    }

    // Token Types
    enum TokenType {
        erc20,
        erc721,
        erc1155
    }

    struct Ingredient {
        TokenType token;
        ConsumableType consumableType;
        address contractAddr;
        uint256 amount;
        uint256 tokenId;
    }

    struct IngredientMany {
        ConsumableType consumableType;
        address contractAddr;
        uint256 amountEach;
        uint256[] tokenIds;
    }
}
