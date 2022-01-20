//SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;


import "@openzeppelin/contracts/utils/Counters.sol";

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";

import "@openzeppelin/contracts/token/ERC721/IERC721.sol";
import "@openzeppelin/contracts/token/ERC721/utils/ERC721Holder.sol";

import "./NFTCrafterLibrary.sol";


/**
 * @dev DIY NFT Crafting Contract.
 *
 */
contract NFTCrafter is ERC721Holder {

    // Increment Recipe IDs
    using Counters for Counters.Counter;
    Counters.Counter private _recipeIds;

    // Store Recipes Locally
    mapping (uint256 => NFTCrafterLibrary.Recipe) _recipes;

    // Modifiers
    modifier onlyRecipeCreator(uint256 recipeId) {
        require(_recipes[recipeId].owner != address(0), "Recipe does not exist!");
        require(_recipes[recipeId].owner == msg.sender, "Only recipe owners can call this!");
        _;
    }

    /**
     * @notice Developer function
     * @dev Dev docs
     * @param inputsERC20 ERC20 inputs for recipe
     * @param inputsERC721 ERC721 inputs for recipe
     * @param outputsERC20 ERC20 outputs for recipe crafting
     * @param outputsERC721 ERC721 outputs for recipe crafting
     */
    function createRecipe(
        NFTCrafterLibrary.RecipeInputERC20[] calldata inputsERC20,
        NFTCrafterLibrary.RecipeInputERC721[] calldata inputsERC721,
        NFTCrafterLibrary.RecipeOutputERC20[] calldata outputsERC20,
        NFTCrafterLibrary.RecipeOutputERC721[] calldata outputsERC721
    ) public {

        // Requires
        require(inputsERC20.length > 0 || inputsERC721.length > 0, "A crafting input must be given!");
        require(outputsERC20.length > 0 || outputsERC721.length > 0, "A crafting output must be given!");

        // Push ID
        _recipeIds.increment();
        uint256 id = _recipeIds.current();

        // Storage pointer
        NFTCrafterLibrary.Recipe storage r = _recipes[id];

        // Store owner
        r.owner = msg.sender;

        // ERC20 Inputs
        for (uint i = 0; i < inputsERC20.length; i++) {
            r.inputsERC20.push(inputsERC20[i]);
        }
        // ERC721 Inputs
        for (uint i = 0; i < inputsERC721.length; i++) {
            r.inputsERC721.push(inputsERC721[i]);
        }
        // ERC20 Outputs
        for (uint i = 0; i < outputsERC20.length; i++) {
            r.outputsERC20.push(outputsERC20[i]);
        }
        // ERC721 Outputs
        for (uint i = 0; i < outputsERC721.length; i++) {
            r.outputsERC721.push(outputsERC721[i]);
        }

        emit NFTCrafterLibrary.CreateRecipe(
            id,
            r.owner,
            inputsERC20,
            inputsERC721,
            outputsERC20,
            outputsERC721
        );

    }

    /**
     * @notice
     * @dev Used to grab recipe details from contract
     * @param recipeId ERC20 inputs for recipe
     * @return NFTCrafterLibrary.Recipe struct
     */
    function getRecipe(uint256 recipeId) public view returns (
        NFTCrafterLibrary.RecipeInputERC20[] memory,
        NFTCrafterLibrary.RecipeInputERC721[] memory,
        NFTCrafterLibrary.RecipeOutputERC20[] memory,
        NFTCrafterLibrary.RecipeOutputERC721[] memory,
        uint256,
        uint256
    ) {
        NFTCrafterLibrary.Recipe storage r = _recipes[recipeId];

        return (
            r.inputsERC20,
            r.inputsERC721,
            r.outputsERC20,
            r.outputsERC721,
            r.craftableAmount,
            r.craftedAmount
        );
    }

    // developer function
    function depositForRecipe(
        uint256 recipeId,
        uint256 craftAmount,
        uint256[][] calldata outputsERC721Ids
    ) public onlyRecipeCreator(recipeId)
    {

    // Recipe Pointer
    NFTCrafterLibrary.Recipe storage r = _recipes[recipeId];

    // Transfer Output ERC20
    for (uint i = 0; i < r.inputsERC20.length; i++) {
        SafeERC20.safeTransferFrom(
            // Token addr
            IERC20(r.inputsERC20[i].contractAddr),
            // from
            msg.sender,
            // to
            address(this),
            // amount
            r.inputsERC20[i].amount*craftAmount
        );
    }

    // Transfer Output ERC721 (2d array)

    // TODO - requires length check
    for (uint i = 0; i < outputsERC721Ids.length; i++) {

        // TODO - require length check
        for (uint j = 0; j < outputsERC721Ids[i].length; i++) {
            // Safe Transfer Each Token
            IERC721(r.outputsERC721[i].contractAddr)
                .safeTransferFrom(
                    msg.sender,
                    address(this),
                    outputsERC721Ids[i][j]
                );
        }
    }

    }

    // developer function
    // withdrawForRecipe(recipeId, withdrawAmount)

    // users function
    // craftForRecipe(recipeId, inputERC721Ids[inputsERC721.length])

}

