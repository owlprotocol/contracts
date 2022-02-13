//SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;


import "@openzeppelin/contracts/utils/Counters.sol";

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";

import "@openzeppelin/contracts/token/ERC721/IERC721.sol";
import "@openzeppelin/contracts/token/ERC721/utils/ERC721Holder.sol";

import "./CraftLib.sol";
import "../Utils/BatchTransfer.sol";


/**
 * @dev Pluggable Crafting Contract.
 */
contract Crafter is ERC721Holder {

    // Increment Recipe IDs
    using Counters for Counters.Counter;
    Counters.Counter private _recipeIds;

    // Store Recipes Locally
    mapping (uint256 => CraftLib.Recipe) private _recipes;

    // Events
    event CreateRecipe(
        uint256 recipeId,
        address indexed owner,
        CraftLib.RecipeInputERC20[] inputsERC20,
        CraftLib.RecipeInputERC721[] inputsERC721,
        CraftLib.RecipeOutputERC20[] outputsERC20,
        CraftLib.RecipeOutputERC721[] outputsERC721
    );
    event RecipeUpdate(
        uint256 indexed recipeId,
        uint256 craftableAmount
    );
    event RecipeCraft(
        uint256 indexed recipeId,
        uint256 craftedAmount,
        uint256 craftableAmount,
        address indexed user
    );

    // Modifiers
    modifier onlyRecipeCreator(uint256 recipeId) {
        require(_recipes[recipeId].owner != address(0), "Specified recipe does not exist!");
        require(_recipes[recipeId].owner == msg.sender, "Only recipe owners can call this!");
        _;
    }

    modifier recipeExists(uint256 recipeId) {
        require(_recipes[recipeId].owner != address(0), "Specified recipe does not exist!");
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
        CraftLib.RecipeInputERC20[] calldata inputsERC20,
        CraftLib.RecipeInputERC721[] calldata inputsERC721,
        CraftLib.RecipeOutputERC20[] calldata outputsERC20,
        CraftLib.RecipeOutputERC721[] calldata outputsERC721
    ) public {

        // Requires
        require(inputsERC20.length > 0 || inputsERC721.length > 0, "A crafting input must be given!");
        require(outputsERC20.length > 0 || outputsERC721.length > 0, "A crafting output must be given!");

        // Push ID
        _recipeIds.increment();
        uint256 id = _recipeIds.current();

        // Storage pointer
        CraftLib.Recipe storage r = _recipes[id];

        // Store owner
        r.owner = msg.sender;

        // ERC20 Inputs
        for (uint i = 0; i < inputsERC20.length; i++)
            r.inputsERC20.push(inputsERC20[i]);
        // ERC721 Inputs
        for (uint i = 0; i < inputsERC721.length; i++)
            r.inputsERC721.push(inputsERC721[i]);
        // ERC20 Outputs
        for (uint i = 0; i < outputsERC20.length; i++)
            r.outputsERC20.push(outputsERC20[i]);
        // ERC721 Outputs
        for (uint i = 0; i < outputsERC721.length; i++) {
            require(outputsERC721[i].ids.length == 0, "Do not include IDs in initialization. Use `createRecipeWithDeposit`.");
            r.outputsERC721.push(outputsERC721[i]);
        }

        emit CreateRecipe(id, r.owner, inputsERC20, inputsERC721, outputsERC20, outputsERC721);

    }

    /**
     * @notice
     * @dev Used to grab recipe details from contract
     * @param recipeId ERC20 inputs for recipe
     * @return inputsERC20 inputsERC721 outputsERC20 outputsERC721 craftableAmount craftedAmount
     */
    function getRecipe(
        uint256 recipeId
    ) public view recipeExists(recipeId) returns (
        CraftLib.RecipeInputERC20[] memory inputsERC20,
        CraftLib.RecipeInputERC721[] memory inputsERC721,
        CraftLib.RecipeOutputERC20[] memory outputsERC20,
        CraftLib.RecipeOutputERC721[] memory outputsERC721,
        uint256 craftableAmount,
        uint256 craftedAmount
    ) {
        CraftLib.Recipe storage r = _recipes[recipeId];

        return (
            r.inputsERC20,
            r.inputsERC721,
            r.outputsERC20,
            r.outputsERC721,
            r.craftableAmount,
            r.craftedAmount
        );
    }

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
    ) public onlyRecipeCreator(recipeId) {
        // Recipe Pointer
        CraftLib.Recipe storage r = _recipes[recipeId];

        // Requires
        require (r.outputsERC721.length == outputsERC721Ids.length, "Missing ERC721 output item(s)! Please include ALL outputs.");

        // Batch Transfer ERC20
        address[] memory tokenAddresses;
        uint256[] memory tokenAmounts;
        ( tokenAddresses, tokenAmounts ) = CraftLib._buildBatchTransferERC20(r.outputsERC20, craftAmount);
        BatchTransfer.transferFromERC20(tokenAddresses, msg.sender, address(this), tokenAmounts);

        // Batch Transfer ERC721
        address[] memory nftAddresses;
        ( nftAddresses, ) = CraftLib._buildBatchTransferERC721(r.outputsERC721, 0); // withdrawAmount=0
        BatchTransfer.transferFromERC721(nftAddresses, msg.sender, address(this), outputsERC721Ids);

        // Add ids to storage
        for (uint i = 0; i < outputsERC721Ids.length; i++)
            for (uint j = 0; j < outputsERC721Ids[i].length; j++)
                r.outputsERC721[i].ids.push(outputsERC721Ids[i][j]);

        // Increase craftableAmount (after transfers have confirmed, prevent reentry)
        r.craftableAmount += craftAmount;


        emit RecipeUpdate(recipeId, r.craftableAmount);
    }

    /**
     * @notice Must be recipe creator
     * @dev Used to withdraw recipe outputs
     * @param recipeId ERC20 inputs for recipe
     * @param withdrawCraftAmount How many times the craft otuputs should be withdrawn
     */
    function withdrawForRecipe(
        uint256 recipeId,
        uint256 withdrawCraftAmount
    ) public onlyRecipeCreator(recipeId) {
        // Recipe Pointer
        CraftLib.Recipe storage r = _recipes[recipeId];

        // Requires
        require(withdrawCraftAmount > 0, "withdrawCraftAmount cannot be 0!");
        require(withdrawCraftAmount <= r.craftableAmount, "Not enough resources to withdraw!");
        // Increase craftableAmount (check-effects)
        r.craftableAmount -= withdrawCraftAmount;

        // Batch Transfer ERC20
        address[] memory tokenAddresses;
        uint256[] memory tokenAmounts;
        ( tokenAddresses, tokenAmounts ) = CraftLib._buildBatchTransferERC20(r.outputsERC20, withdrawCraftAmount);
        BatchTransfer.transferFromERC20(tokenAddresses, address(this), msg.sender, tokenAmounts);

        // Batch Transfer ERC721
        address[] memory nftAddresses;
        uint256[][] memory nftIds;
        ( nftAddresses, nftIds ) = CraftLib._buildBatchTransferERC721(r.outputsERC721, withdrawCraftAmount);
        BatchTransfer.transferFromERC721(nftAddresses, address(this), msg.sender, nftIds);

        emit RecipeUpdate(recipeId,r.craftableAmount);
    }

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
        CraftLib.RecipeInputERC20[] calldata inputsERC20,
        CraftLib.RecipeInputERC721[] calldata inputsERC721,
        CraftLib.RecipeOutputERC20[] calldata outputsERC20,
        CraftLib.RecipeOutputERC721[] calldata outputsERC721,
        uint256 craftAmount,
        uint256[][] calldata outputsERC721Ids
    ) public {
        require(craftAmount != 0, "`craftAmount` must be larger than 0!");

        createRecipe(inputsERC20, inputsERC721, outputsERC20, outputsERC721);

        uint256 recipeId = _recipeIds.current();

        depositForRecipe(recipeId, craftAmount, outputsERC721Ids);

        // Update our owner since it defaulted to function caller (this contract)
        _recipes[recipeId].owner = msg.sender;
    }

    /**
     * @notice Must be recipe creator
     * @dev Used to withdraw recipe outputs
     * @param recipeId ERC20 inputs for recipe
     * @param inputERC721Ids Array of pre-approved NFTs for crafting usage
     */
    function craftForRecipe(
        uint256 recipeId,
        uint256[] calldata inputERC721Ids
    ) public recipeExists(recipeId) {
        // Recipe Pointer
        CraftLib.Recipe storage r = _recipes[recipeId];

        require(r.craftableAmount > 0, "Not enough resources left for crafting!");
        // Update crafting stats (check-effects)
        r.craftableAmount--;
        r.craftedAmount++;

        // Batch Transfer/Verify Input ERC20
        address[] memory addressesERC20;
        uint256[] memory unaffectedAmountsERC20;
        uint256[] memory burnedAmountsERC20;
        ( addressesERC20, unaffectedAmountsERC20, burnedAmountsERC20 ) = CraftLib._splitConsumeablesERC20(r.inputsERC20);
        BatchTransfer.assertBalanceERC20(addressesERC20, msg.sender, unaffectedAmountsERC20);
        BatchTransfer.transferFromERC20(addressesERC20, msg.sender, address(this), burnedAmountsERC20);

        // Batch Transfer/Verify Input ERC721
        address[] memory addressesERC721;
        uint256[][] memory unaffectedAmountsERC721;
        uint256[][] memory burnedAmountsERC721;
        ( addressesERC721, unaffectedAmountsERC721, burnedAmountsERC721 ) = CraftLib._splitConsumeablesERC721(r.inputsERC721, inputERC721Ids);
        BatchTransfer.assertBalanceERC721(addressesERC721, msg.sender, unaffectedAmountsERC721);
        BatchTransfer.transferFromERC721(addressesERC721, msg.sender, address(this), burnedAmountsERC721);

        // Batch Transfer Output ERC20
        address[] memory tokenAddresses;
        uint256[] memory tokenAmounts;
        ( tokenAddresses, tokenAmounts ) = CraftLib._buildBatchTransferERC20(r.outputsERC20, 1);
        BatchTransfer.transferFromERC20(tokenAddresses, address(this), msg.sender, tokenAmounts);

        // Batch Transfer Output ERC721
        address[] memory nftAddresses;
        uint256[][] memory nftIds;
        ( nftAddresses, nftIds ) = CraftLib._buildBatchTransferERC721(r.outputsERC721, 1); // craftAmount = 1
        BatchTransfer.transferFromERC721(nftAddresses, address(this), msg.sender, nftIds);

        emit RecipeCraft(recipeId, r.craftedAmount, r.craftableAmount, msg.sender);
    }
}
