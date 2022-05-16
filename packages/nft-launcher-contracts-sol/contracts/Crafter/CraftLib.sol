//SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC721/IERC721.sol";

/**
 * @dev Basic crafting structures used through NFTCrafting contracts.
 *
 */
library CraftLib {

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
        address burnAddress;

        RecipeInputERC20[] inputsERC20;
        RecipeInputERC721[] inputsERC721;

        RecipeOutputERC20[] outputsERC20;
        RecipeOutputERC721[] outputsERC721;

        uint256 craftableAmount;
        uint256 craftedAmount;

    }

    /**
     * @dev Builds a batch transfer array for ERC20 outputs
     * @param outputsERC20 ERC20 outputs to manage transferring
     * @param multiplier How much to multiply each amount by.
     * @return tokenAddresses memory array of token addresses for batch transferring
     * @return transferAmounts calculated token amounts for batch transferring
     */
    function _buildBatchTransferERC20(
        CraftLib.RecipeOutputERC20[] storage outputsERC20,
        uint256 multiplier
    ) internal view returns(
        address[] memory tokenAddresses,
        uint256[] memory transferAmounts
    ) {
        address[] memory addresses = new address[](outputsERC20.length);
        uint256[] memory amounts = new uint256[](outputsERC20.length);
        for (uint i = 0; i < outputsERC20.length; i++) {
            addresses[i] = outputsERC20[i].contractAddr;
            amounts[i] = outputsERC20[i].amount*multiplier;
        }
        return (addresses, amounts);
    }

    /**
     * @dev Builds a batch transfer array for ERC721 outputs
     * @param outputsERC721 ERC721 outputs to manage transferring
     * @param withdrawAmount How many ids to grab, remove and return from storage as `nftIds`. '
     * @return nftAddresses memory array of NFT addresses for batch transferring
     * @return nftIds token identifiers for NFT batch transferring
     */
    function _buildBatchTransferERC721(
        CraftLib.RecipeOutputERC721[] storage outputsERC721,
        uint256 withdrawAmount
    ) internal returns (
        address[] memory nftAddresses,
        uint256[][] memory nftIds
    ) {
        address[] memory addresses = new address[](outputsERC721.length);
        uint256[][] memory tokenIds = new uint256[][](outputsERC721.length);
        for (uint nftIdx = 0; nftIdx < outputsERC721.length; nftIdx++) {
            addresses[nftIdx] = outputsERC721[nftIdx].contractAddr;
            if (withdrawAmount != 0) {
                // If we're withdrawing anything, grab / pop ids from storage
                uint256[] memory ids = new uint256[](withdrawAmount);
                for (uint token = 0; token < withdrawAmount; token++) {
                    ids[token] = outputsERC721[nftIdx].ids[outputsERC721[nftIdx].ids.length-1];
                    outputsERC721[nftIdx].ids.pop();
                }
                tokenIds[nftIdx] = ids;
            }
        }
        return (addresses, tokenIds);
    }

    /**
     * @dev Splits an ERC20 input list into unaffected and burn lists
     * @param inputsERC20 ERC721 outputs to manage transferring
     * @return tokenAddressesList memory array of NFT addresses for batch transferring
     * @return unaffectedAmountsList memory array of unaffected amounts for batch transferring
     * @return burnedAmountsList memory array of burn amounts for batch transferring
     */
    function _splitConsumeablesERC20(
        CraftLib.RecipeInputERC20[] storage inputsERC20
    ) internal view returns (
        address[] memory tokenAddressesList,
        uint256[] memory unaffectedAmountsList,
        uint256[] memory burnedAmountsList
    ) {
        address[] memory tokenAddresses = new address[](inputsERC20.length);
        uint256[] memory unaffectedAmounts = new uint256[](inputsERC20.length);
        uint256[] memory burnedAmounts = new uint256[](inputsERC20.length);

        for (uint token = 0; token < inputsERC20.length; token++) {
            // Store address
            tokenAddresses[token] = inputsERC20[token].contractAddr;
            if (inputsERC20[token].consumableType == CraftLib.ConsumableType.unaffected)
                // burned amount will default to 0
                unaffectedAmounts[token] = inputsERC20[token].amount;
            else if (inputsERC20[token].consumableType == CraftLib.ConsumableType.burned)
                // unaffected will default to 0
                burnedAmounts[token] = inputsERC20[token].amount;
            else
                revert();
        }

        return (
            tokenAddresses,
            unaffectedAmounts,
            burnedAmounts
        );
    }

    /**
     * @dev Splits an ERC20 input list into unaffected and burn lists
     * @param inputsERC721 ERC721 outputs to manage transferring
     * @param tokenIds associated output token ids
     * @return tokenAddressesList memory array of NFT addresses for batch transferring
     * @return unaffectedAmountsList memory array of unaffected ids for batch transferring
     * @return burnedAmountsList memory array of burn ids for batch transferring
     */
    function _splitConsumeablesERC721(
        CraftLib.RecipeInputERC721[] storage inputsERC721,
        uint256[] calldata tokenIds
    ) internal view returns (
        address[] memory tokenAddressesList,
        uint256[][] memory unaffectedAmountsList,
        uint256[][] memory burnedAmountsList
    ) {
        address[] memory tokenAddresses = new address[](inputsERC721.length);
        uint256[][] memory unaffectedIds = new uint256[][](inputsERC721.length);
        uint256[][] memory burnedIds = new uint256[][](inputsERC721.length);

        for (uint token = 0; token < inputsERC721.length; token++) {
            // Store address
            tokenAddresses[token] = inputsERC721[token].contractAddr;
            // Batch transfer expects a 2d array for ERC721 transfers, so generate that.
            uint256[] memory unaffectedId = new uint256[](1);
            uint256[] memory burnedId = new uint256[](1);
            if (inputsERC721[token].consumableType == CraftLib.ConsumableType.unaffected) {
                unaffectedId[0] = tokenIds[token];
                burnedId[0] = type(uint).max;  // invalidate transfer in batch, converts to uint(-1)
            } else if (inputsERC721[token].consumableType == CraftLib.ConsumableType.burned) {
                unaffectedId[0] = type(uint).max;  // invalidate ownership check, converts to uint(-1)
                burnedId[0] = tokenIds[token];
            } else
                // This should never happen.
                revert();
            // Store in 2d-array
            unaffectedIds[token] = unaffectedId;
            burnedIds[token] = burnedId;
        }

        return (
            tokenAddresses,
            unaffectedIds,
            burnedIds
        );
    }


}
