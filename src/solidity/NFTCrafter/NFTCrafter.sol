//SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;


import "@openzeppelin/contracts/utils/Counters.sol";
import "./NFTCrafterLibrary.sol";


/**
 * @dev DIY NFT Crafting Contract.
 *
 */
contract NFTCrafter {

    // Increment Recipe IDs
    using Counters for Counters.Counter;
    Counters.Counter private _recipeIds;

    // Store Recipes Locally
    mapping (uint256 => NFTCrafterLibrary.Recipe) _recipes;

    // Events
    event CreateRecipe(
        uint256 recipeId
    );

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

        emit CreateRecipe(id);

    }

    /**
     * @notice
     * @dev Used to grab recipe details from contract
     * @param recipeId ERC20 inputs for recipe
     * @return NFTCrafterLibrary.Recipe struct
     */
    function getRecipe(uint256 recipeId) public view returns (NFTCrafterLibrary.RecipeInfo memory) {
        NFTCrafterLibrary.Recipe storage r = _recipes[recipeId];

        return NFTCrafterLibrary.RecipeInfo({
            inputsERC20: r.inputsERC20,
            inputsERC721: r.inputsERC721,
            outputsERC20: r.outputsERC20,
            outputsERC721: r.outputsERC721,
            craftableAmount: r.craftableAmount,
            craftedAmount: r.craftedAmount
        });
    }

    // developer function
    // depositForRecipe(recipeId, depositAmount, outputsERC721Ids uint256[][depositAmount])

    // developer function
    // withdrawForRecipe(recipeId, withdrawAmount)

    // users function
    // craftForRecipe(recipeId, inputERC721Ids[inputsERC721.length])

}

