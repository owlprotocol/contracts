//SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/utils/introspection/IERC165.sol";

/**
 * @dev Allow/deny minting based on conditions.
 * Functionality is up to the implementer, allowing for a range
 * of mints including raffle winners, merkle trees, allowlists, etc.
 */
interface IMintGuard is IERC165 {

    /**
     * @dev Only required function for mint guards
     * @param speciesId identifier
     * @param userMinting user attempting mint operation
     */
    function allowMint(
        uint256 speciesId,
        address userMinting
    ) external  returns (
        bool // True / false -> allow minting operation to proceed.
    );

}
