// SPDX-License-Identifier: MIT
pragma solidity ^0.8.4;

import '@openzeppelin/contracts/token/ERC721/IERC721.sol';
import '@openzeppelin/contracts/access/IAccessControl.sol';

interface IERC721Mintable is IERC721, IAccessControl {
    /**
     * @notice Must have MINTER_ROLE
     * @dev Allows MINTER_ROLE to mint NFTs
     * @param to address to
     * @param tokenId tokenId value
     */
    function mint(address to, uint256 tokenId) external;

    /**
     * @notice Must have MINTER_ROLE
     * @dev Allows caller to mint NFTs (safeMint)
     * @param to address to
     * @param tokenId tokenId value
     */
    function safeMint(address to, uint256 tokenId) external;

    /**
     * @notice Must have ADMIN role!
     * @dev Allows setting the baseURI
     * @param baseURI_ set the baseURI value.
     */
    function setBaseURI(string calldata baseURI_) external;
}
