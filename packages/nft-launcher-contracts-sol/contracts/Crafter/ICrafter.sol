//SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import '@openzeppelin/contracts/token/ERC721/IERC721Receiver.sol';

import './PluginsLib.sol';

/**
 * @dev DIY NFT Crafting Contract.
 *
 */
interface INFTCrafter is IERC721Receiver {
    /**
     * @notice Developer function
     * @dev Dev docs
     * @param inputsERC20 ERC20 inputs for recipe
     * @param inputsERC721 ERC721 inputs for recipe
     * @param outputsERC20 ERC20 outputs for recipe crafting
     * @param outputsERC721 ERC721 outputs for recipe crafting
     */
    function createRecipe(
        PluginsLib.RecipeInputERC20[] calldata inputsERC20,
        PluginsLib.RecipeInputERC721[] calldata inputsERC721,
        PluginsLib.RecipeOutputERC20[] calldata outputsERC20,
        PluginsLib.RecipeOutputERC721[] calldata outputsERC721
    ) external;

    /**
     * @notice
     * @dev Used to grab recipe details from contract
     * @param recipeId ERC20 inputs for recipe
     * @return PluginsLib.Recipe struct
     */
    function getRecipe(uint256 recipeId)
        external
        view
        returns (
            PluginsLib.RecipeInputERC20[] memory,
            PluginsLib.RecipeInputERC721[] memory,
            PluginsLib.RecipeOutputERC20[] memory,
            PluginsLib.RecipeOutputERC721[] memory,
            uint256,
            uint256
        );

    /**
     * @notice Must be recipe creator
     * @dev Used to deposit recipe outputs
     * @param recipeId ERC20 inputs for recipe
     * @param craftAmount How many times the recipe should be craftable
     * @param outputsERC721Ids 2D-array of ERC721 tokens used in crafting
     */
    function depositForRecipe(
        uint256 recipeId,
        uint256 craftAmount,
        uint256[][] calldata outputsERC721Ids
    ) external;

    /**
     * @notice Must be recipe creator
     * @dev Used to withdraw recipe outputs
     * @param recipeId ERC20 inputs for recipe
     * @param withdrawCraftAmount How many times the craft otuputs should be withdrawn
     */
    function withdrawForRecipe(uint256 recipeId, uint256 withdrawCraftAmount) external;

    /**
     * @dev Creates a recipe while transferring assets to allow for immediate usage
     * @param inputsERC20 ERC20 inputs for recipe
     * @param inputsERC721 ERC721 inputs for recipe
     * @param outputsERC20 ERC20 outputs for recipe crafting
     * @param outputsERC721 ERC721 outputs for recipe crafting
     * @param craftAmount How many times the recipe should be craftable
     * @param outputsERC721Ids 2D-array of ERC721 tokens used in crafting
     */
    function createRecipeWithDeposit(
        PluginsLib.RecipeInputERC20[] calldata inputsERC20,
        PluginsLib.RecipeInputERC721[] calldata inputsERC721,
        PluginsLib.RecipeOutputERC20[] calldata outputsERC20,
        PluginsLib.RecipeOutputERC721[] calldata outputsERC721,
        uint256 craftAmount,
        uint256[][] calldata outputsERC721Ids
    ) external;

    /**
     * @notice Must be recipe creator
     * @dev Used to withdraw recipe outputs
     * @param recipeId ERC20 inputs for recipe
     * @param inputERC721Ids Array of pre-approved NFTs for crafting usage
     */
    function craftForRecipe(uint256 recipeId, uint256[] calldata inputERC721Ids) external;
}
