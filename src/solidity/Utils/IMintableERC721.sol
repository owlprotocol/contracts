//SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/token/ERC721/IERC721.sol";

/**
 * @dev Mintable ERC721 contract.
 * Required mintable function for `Mintable`
 * NFTGenerator.
 */
interface IMintableERC721 is IERC721 {

    function mint(address to) external;

    function safeMint(address to) external;
}
