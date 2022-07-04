//SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

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
        uint256[] amounts;
        uint256[] tokenIds;
    }

    struct IngredientMany {
        ConsumableType consumableType;
        address contractAddr;
        uint256 amountEach;
        uint256[] tokenIds;
    }
}
