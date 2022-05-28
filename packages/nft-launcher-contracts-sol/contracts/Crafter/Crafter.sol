//SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import '@openzeppelin/contracts-upgradeable/token/ERC721/utils/ERC721HolderUpgradeable.sol';
import '@openzeppelin/contracts-upgradeable/token/ERC1155/utils/ERC1155HolderUpgradeable.sol';

import '@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol';
import '@openzeppelin/contracts-upgradeable/access/OwnableUpgradeable.sol';

import './CraftLib.sol';
import '../Utils/BatchTransfer.sol';

/**
 * @dev Pluggable Crafting Contract.
 */
contract Crafter is Initializable, OwnableUpgradeable, ERC721HolderUpgradeable, ERC1155HolderUpgradeable, CraftLib {
    // Core Recipe Variables
    bool public frozen;
    address public owner;
    address public burnAddress;
    uint256 public craftableAmount;
    uint256 public craftedAmount;
    IngredientMany[] public ingredients;

    // Events
    event Craft(address indexed user);

    /// @custom:oz-upgrades-unsafe-allow constructor
    constructor() initializer {}

    function initialize(
        address _burnAddress,
        IngredientMany[] memory _ingredients,
        uint256 _initialCraftable
    ) public initializer {
        owner = msg.sender;
        burnAddress = _burnAddress;
        // TODO - verify starting amount + ids
        for (uint256 i; i < _ingredients.length; i++) ingredients.push(_ingredients[i]);
    }

    /**
     * @notice Must be recipe creator
     * @dev Used to deposit recipe outputs
     * @param recipeId ERC20 inputs for recipe
     * @param _ingredients ERC20/ERC721/ERC1155 ingredients depositing (token ids)
     * @param _craftAmount How many times the recipe should be craftable
     */
    function depositIngredients(
        uint256 recipeId,
        IngredientMany[] memory _ingredients,
        uint256 _craftAmount
    ) public onlyOwner {
        // Recipe Pointer
        CraftLib.Recipe storage r = _recipes[recipeId];

        // Requires
        require(
            r.outputsERC721.length == outputsERC721Ids.length,
            'Missing ERC721 output item(s)! Please include ALL outputs.'
        );

        // Batch Transfer ERC20
        address[] memory tokenAddresses;
        uint256[] memory tokenAmounts;
        (tokenAddresses, tokenAmounts) = CraftLib._buildBatchTransferERC20(r.outputsERC20, craftAmount);
        BatchTransfer.transferFromERC20(tokenAddresses, msg.sender, address(this), tokenAmounts);

        // Batch Transfer ERC721
        address[] memory nftAddresses;
        (nftAddresses, ) = CraftLib._buildBatchTransferERC721(r.outputsERC721, 0); // withdrawAmount=0
        BatchTransfer.transferFromERC721(nftAddresses, msg.sender, address(this), outputsERC721Ids);

        // Add ids to storage
        for (uint256 i = 0; i < outputsERC721Ids.length; i++)
            for (uint256 j = 0; j < outputsERC721Ids[i].length; j++)
                r.outputsERC721[i].ids.push(outputsERC721Ids[i][j]);

        // Increase craftableAmount (after transfers have confirmed, prevent reentry)
        r.craftableAmount += craftAmount;

        emit RecipeUpdate(recipeId, r.craftableAmount);
    }

    /**
     * @notice Must be recipe creator
     * @dev Used to withdraw recipe outputs
     * @param _craftAmount number of ingredient sets to withdraw
     */
    function withdrawIngredients(uint256 _craftAmount) public onlyOwner {
        // Recipe Pointer
        CraftLib.Recipe storage r = _recipes[recipeId];

        // Requires
        require(withdrawCraftAmount > 0, 'withdrawCraftAmount cannot be 0!');
        require(withdrawCraftAmount <= r.craftableAmount, 'Not enough resources to withdraw!');

        // Batch Transfer ERC20
        address[] memory tokenAddresses;
        uint256[] memory tokenAmounts;
        (tokenAddresses, tokenAmounts) = CraftLib._buildBatchTransferERC20(r.outputsERC20, withdrawCraftAmount);
        BatchTransfer.transferFromERC20(tokenAddresses, address(this), msg.sender, tokenAmounts);

        // Batch Transfer ERC721
        address[] memory nftAddresses;
        uint256[][] memory nftIds;
        (nftAddresses, nftIds) = CraftLib._buildBatchTransferERC721(r.outputsERC721, withdrawCraftAmount);
        BatchTransfer.transferFromERC721(nftAddresses, address(this), msg.sender, nftIds);

        // Increase craftableAmount (check-effects)
        r.craftableAmount -= withdrawCraftAmount;

        emit RecipeUpdate(recipeId, r.craftableAmount);
    }

    /**
     * @notice Must be recipe creator
     * @dev Used to withdraw recipe outputs
     * @param recipeId ERC20 inputs for recipe
     * @param inputERC721Ids Array of pre-approved NFTs for crafting usage
     */
    function craft(IngredientMany[] memory _ingredients, uint256 _craftAmount) public {
        // Recipe Pointer
        CraftLib.Recipe storage r = _recipes[recipeId];
        address burnAddress = r.burnAddress != address(0) ? r.burnAddress : address(this);

        require(r.craftableAmount > 0, 'Not enough resources left for crafting!');
        // Update crafting stats (check-effects)
        r.craftableAmount--;
        r.craftedAmount++;
        {
            // Batch Transfer/Verify Input ERC20
            address[] memory addressesERC20;
            uint256[] memory unaffectedAmountsERC20;
            uint256[] memory burnedAmountsERC20;
            (addressesERC20, unaffectedAmountsERC20, burnedAmountsERC20) = CraftLib._splitConsumeablesERC20(
                r.inputsERC20
            );
            BatchTransfer.assertBalanceERC20(addressesERC20, msg.sender, unaffectedAmountsERC20);
            BatchTransfer.transferFromERC20(addressesERC20, msg.sender, burnAddress, burnedAmountsERC20);

            // Batch Transfer/Verify Input ERC721
            address[] memory addressesERC721;
            uint256[][] memory unaffectedAmountsERC721;
            uint256[][] memory burnedAmountsERC721;
            (addressesERC721, unaffectedAmountsERC721, burnedAmountsERC721) = CraftLib._splitConsumeablesERC721(
                r.inputsERC721,
                inputERC721Ids
            );
            BatchTransfer.assertBalanceERC721(addressesERC721, msg.sender, unaffectedAmountsERC721);
            BatchTransfer.transferFromERC721(addressesERC721, msg.sender, burnAddress, burnedAmountsERC721);
        }

        {
            // Batch Transfer Output ERC20
            address[] memory tokenAddresses;
            uint256[] memory tokenAmounts;
            (tokenAddresses, tokenAmounts) = CraftLib._buildBatchTransferERC20(r.outputsERC20, 1);
            BatchTransfer.transferFromERC20(tokenAddresses, address(this), msg.sender, tokenAmounts);

            // Batch Transfer Output ERC721
            address[] memory nftAddresses;
            uint256[][] memory nftIds;
            (nftAddresses, nftIds) = CraftLib._buildBatchTransferERC721(r.outputsERC721, 1); // craftAmount = 1
            BatchTransfer.transferFromERC721(nftAddresses, address(this), msg.sender, nftIds);
        }

        emit RecipeCraft(recipeId, r.craftedAmount, r.craftableAmount, msg.sender);
    }
}
