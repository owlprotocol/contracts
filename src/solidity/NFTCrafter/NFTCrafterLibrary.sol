//SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC721/IERC721.sol";

/**
 * @dev Basic crafting structures used through NFTCrafting contracts.
 *
 */
library NFTCrafterLibrary {

    // Recipe Components
    enum ConsumableType {
        unaffected,
        burned
    }

    struct RecipeInputERC20 {
        address contractAddr;
        ConsumableType consumableType;
        uint256 amount;
    }

    struct RecipeInputERC721 {
        address contractAddr;
        ConsumableType consumableType;
        uint256 amount;
    }

    struct RecipeOutputERC20 {
        address contractAddr;
        uint256 amount;
    }

    struct RecipeOutputERC721 {
        address contractAddr;
        uint256[] ids;
    }

    // Recipe
    struct Recipe {

        address owner;

        RecipeInputERC20[] inputsERC20;
        RecipeInputERC721[] inputsERC721;

        RecipeOutputERC20[] outputsERC20;
        RecipeOutputERC721[] outputsERC721;

        uint256 craftableAmount;
        uint256 craftedAmount;

    }

    // Events
    event CreateRecipe(
        uint256 recipeId,
        address owner,
        RecipeInputERC20[] inputsERC20,
        RecipeInputERC721[] inputsERC721,
        RecipeOutputERC20[] outputsERC20,
        RecipeOutputERC721[] outputsERC721
    );


}
