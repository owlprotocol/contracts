// SPDX-License-Identifier: MIT
pragma solidity ^0.8.4;

import '@openzeppelin/contracts/token/ERC721/ERC721.sol';
import '@openzeppelin/contracts/access/AccessControl.sol';

contract ERC721Mintable is ERC721, AccessControl {
    bytes32 public constant MINTER_ROLE = keccak256('MINTER_ROLE');

    string public baseURI;

    /**
     * @dev Creates an ERC721 contract
     * @param name_ name of ERC721 token
     * @param symbol_ symbol for ERC721 token
     * @param baseURI_ baseURI metadata
     */
    constructor(
        string memory name_,
        string memory symbol_,
        string memory baseURI_
    ) ERC721(name_, symbol_) {
        _grantRole(DEFAULT_ADMIN_ROLE, msg.sender);
        _grantRole(MINTER_ROLE, msg.sender);
        baseURI = baseURI_;
    }

    /**
     * @notice Must have MINTER_ROLE
     * @dev Allows MINTER_ROLE to mint NFTs
     * @param to address to
     * @param tokenId tokenId value
     */
    function mint(address to, uint256 tokenId) public onlyRole(MINTER_ROLE) {
        _mint(to, tokenId);
    }

    /**
     * @notice Must have MINTER_ROLE
     * @dev Allows caller to mint NFTs (safeMint)
     * @param to address to
     * @param tokenId tokenId value
     */
    function safeMint(address to, uint256 tokenId) public onlyRole(MINTER_ROLE) {
        _safeMint(to, tokenId);
    }

    /**
     * @notice Must have ADMIN role!
     * @dev Allows setting the baseURI
     * @param baseURI_ set the baseURI value.
     */
    function setBaseURI(string calldata baseURI_) public onlyRole(DEFAULT_ADMIN_ROLE) {
        baseURI = baseURI_;
    }

    /**
     * @dev Alternative getter for baseURI
     */
    function _baseURI() internal view override returns (string memory) {
        return baseURI;
    }

    // The following functions are overrides required by Solidity.

    function supportsInterface(bytes4 interfaceId) public view override(ERC721, AccessControl) returns (bool) {
        return super.supportsInterface(interfaceId);
    }
}
