//SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";

import "@openzeppelin/contracts/token/ERC721/IERC721.sol";

/**
 * @dev Sources different levels of randomness
 *
 */
library BatchTransfer {

    /**
     * @dev Used to withdraw recipe outputs
     * @param tokenAddresses ERC20 token addresses to transfer
     * @param from address transferring from
     * @param to address transferring to
     * @param amounts How many times the craft otuputs should be withdrawn
     */
    function transferFromERC20(
        address[] memory tokenAddresses,
        address from,
        address to,
        uint256[] memory amounts
    ) internal {
        require(tokenAddresses.length == amounts.length, "Mismatching supplied tokenAddresses and amounts!");
        // Transfer
        for (uint tokenIdx = 0; tokenIdx < tokenAddresses.length; tokenIdx++) {
            if (amounts[tokenIdx] == 0)
                // Don't transfer amounts = 0
                continue;
            else if (from == address(this))
                // Transferring from this contract, don't use transferFrom
                SafeERC20.safeTransfer(IERC20(tokenAddresses[tokenIdx]), to, amounts[tokenIdx]);
            else
                SafeERC20.safeTransferFrom(IERC20(tokenAddresses[tokenIdx]), from, to, amounts[tokenIdx]);
        }
    }

    /**
     * @dev Used to assert a minimum balance of ERC20 token
     * @param tokenAddresses ERC20 token addresses to transfer
     * @param account address of user/contract to check balance of
     * @param amounts What the minimum balance should be
     */
    function assertBalanceERC20(
        address[] memory tokenAddresses,
        address account,
        uint256[] memory amounts
    ) internal view {
        require(tokenAddresses.length == amounts.length, "Mismatching supplied tokenAddresses and amounts!");
        // Transfer
        for (uint tokenIdx = 0; tokenIdx < tokenAddresses.length; tokenIdx++) {
            if (amounts[tokenIdx] == 0)
                // Don't check amounts = 0
                continue;
            require(
                IERC20(tokenAddresses[tokenIdx]).balanceOf(account) >= amounts[tokenIdx],
                "User missing minimum token balance(s)!"
            );
        }
    }


    /**
     * @dev Used to withdraw recipe outputs
     * @param tokenAddresses ERC721 token addresses to transfer
     * @param from address transferring from
     * @param to address transferring to
     * @param ids 2d array of tokenIds to transfer
     */
    function transferFromERC721(
        address[] memory tokenAddresses,
        address from,
        address to,
        uint256[][] memory ids
    ) internal {
        require(tokenAddresses.length == ids.length, "Mismatching token IDs");
        // Transfer operations
        for (uint nftIdx = 0; nftIdx < tokenAddresses.length; nftIdx++)
            for (uint tokenIdx = 0; tokenIdx < ids[nftIdx].length; tokenIdx++) {
                if (ids[nftIdx][tokenIdx] == type(uint).max)
                    // Skip when tokenId = uint(-1)
                    continue;
                IERC721(tokenAddresses[nftIdx])
                    .safeTransferFrom(from, to, ids[nftIdx][tokenIdx]);
            }
    }

    /**
     * @dev Used to assert ownership of an NFT
     * @param tokenAddresses ERC721 token addresses to check
     * @param account address of user/contract to compare ownership with
     * @param ids NFT ids to check ownership of
     */
    function assertBalanceERC721(
        address[] memory tokenAddresses,
        address account,
        uint256[][] memory ids
    ) internal view {
        require(tokenAddresses.length == ids.length, "Mismatching supplied tokenAddresses and amounts!");
        // Transfer
        for (uint nftIdx = 0; nftIdx < tokenAddresses.length; nftIdx++)
            for (uint tokenIdx = 0; tokenIdx < ids[nftIdx].length; tokenIdx++) {
                if (ids[nftIdx][tokenIdx] == type(uint).max)
                    // Don't check ids = uint(-1)
                    continue;
                require(
                    IERC721(tokenAddresses[nftIdx]).ownerOf(ids[nftIdx][tokenIdx]) == account,
                    "User does not own token(s)!"
                );
            }
    }


}
